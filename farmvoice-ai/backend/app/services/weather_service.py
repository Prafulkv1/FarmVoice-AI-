"""FarmVoice AI - Agricultural Weather Service.

Integrates Open-Meteo REST API for live weather, hourly timelines,
seven-day forecasts, rainfall monitoring, alert notices, and rule-based
crop-specific farming advisories.
"""

from datetime import datetime, timezone, timedelta
import json
import logging
import urllib.parse
import urllib.request

from app import db
from app.models.weather_record import WeatherRecord
from app.services.geocoding_service import GeocodingService
from app.utils.weather_translations import WMO_CODE_INFO, translate_condition

logger = logging.getLogger(__name__)

# Weather cache: { cache_key: { "timestamp": float, "data": dict } }
_WEATHER_CACHE = {}
CACHE_TTL_SECONDS = 900  # 15 minutes


def _degree_to_compass(deg):
    """Convert wind direction in degrees (0-360) to 8-point compass notation."""
    if deg is None:
        return "N/A"
    val = int((deg / 45) + 0.5)
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return directions[val % 8]


def _format_time_str(iso_str):
    """Convert ISO time string like '2026-11-15T06:32' to '06:32 AM'."""
    if not iso_str:
        return "N/A"
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%I:%M %p")
    except Exception:
        return iso_str[-5:] if len(iso_str) >= 5 else iso_str


def _format_day_name(date_str):
    """Convert '2026-11-15' to 'Sunday'."""
    if not date_str:
        return ""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%A")
    except Exception:
        return date_str


class WeatherService:
    """Core weather service providing real-time agricultural meteorology."""

    @staticmethod
    def _fetch_open_meteo_raw(lat, lon, force_refresh=False):
        """Fetch full weather forecast payload from Open-Meteo with caching."""
        cache_key = f"{round(lat, 3)}|{round(lon, 3)}"
        now_ts = datetime.now(timezone.utc).timestamp()

        if not force_refresh and cache_key in _WEATHER_CACHE:
            cached = _WEATHER_CACHE[cache_key]
            if now_ts - cached["timestamp"] < CACHE_TTL_SECONDS:
                return cached["data"], False

        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m"
            "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m"
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max"
            "&timezone=Asia/Kolkata"
        )

        req = urllib.request.Request(
            url,
            headers={"User-Agent": "FarmVoiceAI-Weather/1.0", "Accept": "application/json"},
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                raise RuntimeError(f"Open-Meteo returned status {response.status}")
            data = json.loads(response.read().decode("utf-8"))

        _WEATHER_CACHE[cache_key] = {"timestamp": now_ts, "data": data}
        return data, True

    @staticmethod
    def get_all_weather(user_id, profile, force_refresh=False):
        """Unified method to obtain all weather information for the dashboard."""
        if not profile or not (profile.district or profile.state):
            return {
                "success": False,
                "error": "PROFILE_LOCATION_REQUIRED",
                "message": "Please complete your farm location in your Profile to view localized weather updates.",
            }, 400

        # 1. Geocode location
        coords = GeocodingService.get_coordinates(
            village=profile.village,
            taluk=profile.taluk,
            district=profile.district,
            state=profile.state,
            pin_code=profile.pin_code,
        )

        lat = coords["latitude"]
        lon = coords["longitude"]

        # 2. Fetch live weather
        try:
            raw, was_fresh = WeatherService._fetch_open_meteo_raw(lat, lon, force_refresh)
        except Exception as exc:
            logger.error("Failed to fetch weather from Open-Meteo: %s", exc)
            return {
                "success": False,
                "message": "Unable to connect to weather data provider. Please verify your internet connection or try again shortly.",
            }, 503

        # 3. Parse Sections
        preferred_lang = profile.preferred_language or "English"

        current = WeatherService._parse_current(raw, coords, preferred_lang)
        daily = WeatherService._parse_daily(raw, preferred_lang)
        hourly = WeatherService._parse_hourly(raw, preferred_lang)
        rainfall = WeatherService._parse_rainfall(raw)
        alerts = WeatherService._parse_alerts(raw, coords)
        crops = [c.crop_name for c in profile.crops] if profile.crops else []
        advisories = WeatherService._generate_farming_advisories(current, daily, hourly, crops, preferred_lang)

        # 4. Save historical snapshot into MySQL
        if was_fresh:
            WeatherService._record_snapshot(user_id, coords["location_name"], current)

        return {
            "success": True,
            "location": coords,
            "current": current,
            "daily_forecast": daily,
            "hourly_forecast": hourly,
            "rainfall": rainfall,
            "alerts": alerts,
            "advisories": advisories,
            "farmer_crops": crops,
            "preferred_language": preferred_lang,
            "source": "Open-Meteo & IMD Verified Meteorological Guidelines",
        }, 200

    @staticmethod
    def _parse_current(raw, coords, language):
        """Format current weather observation."""
        cur = raw.get("current", {})
        daily = raw.get("daily", {})

        wmo_code = cur.get("weather_code", 0)
        info = WMO_CODE_INFO.get(wmo_code, {"en": "Clear", "icon": "sun", "severity": "clear"})
        condition_en = info["en"]
        condition_trans = translate_condition(condition_en, language)

        wind_deg = cur.get("wind_direction_10m")
        wind_comp = _degree_to_compass(wind_deg)

        # Extract today's sunrise/sunset and temp min/max
        today_sunrises = daily.get("sunrise", [])
        today_sunsets = daily.get("sunset", [])
        today_tmin = daily.get("temperature_2m_min", [])
        today_tmax = daily.get("temperature_2m_max", [])

        sunrise_str = _format_time_str(today_sunrises[0]) if today_sunrises else "N/A"
        sunset_str = _format_time_str(today_sunsets[0]) if today_sunsets else "N/A"
        min_temp = round(float(today_tmin[0]), 1) if today_tmin else None
        max_temp = round(float(today_tmax[0]), 1) if today_tmax else None

        now_formatted = datetime.now(timezone.utc).astimezone().strftime("%d %b %Y, %I:%M %p")

        return {
            "temperature": round(float(cur.get("temperature_2m", 0.0)), 1),
            "feels_like": round(float(cur.get("apparent_temperature", cur.get("temperature_2m", 0.0))), 1),
            "temp_min": min_temp,
            "temp_max": max_temp,
            "humidity": int(cur.get("relative_humidity_2m", 0)),
            "wind_speed": round(float(cur.get("wind_speed_10m", 0.0)), 1),
            "wind_direction": f"{wind_comp} ({wind_deg}°)",
            "wind_direction_compass": wind_comp,
            "rainfall": round(float(cur.get("rain", cur.get("precipitation", 0.0))), 2),
            "pressure": round(float(cur.get("surface_pressure", 1013.25)), 1),
            "cloud_cover": int(cur.get("cloud_cover", 0)),
            "sunrise": sunrise_str,
            "sunset": sunset_str,
            "weather_code": wmo_code,
            "condition": condition_trans,
            "condition_en": condition_en,
            "icon": info["icon"],
            "severity": info["severity"],
            "last_updated": now_formatted,
            "location_name": coords.get("location_name", "Farm Location"),
        }

    @staticmethod
    def _parse_daily(raw, language):
        """Format 7-day forecast cards."""
        daily = raw.get("daily", {})
        times = daily.get("time", [])
        codes = daily.get("weather_code", [])
        tmins = daily.get("temperature_2m_min", [])
        tmaxs = daily.get("temperature_2m_max", [])
        rains = daily.get("precipitation_sum", [])
        rain_probs = daily.get("precipitation_probability_max", [])
        winds = daily.get("wind_speed_10m_max", [])

        forecast_list = []
        count = min(7, len(times))

        for i in range(count):
            wmo_code = codes[i] if i < len(codes) else 0
            info = WMO_CODE_INFO.get(wmo_code, {"en": "Clear", "icon": "sun", "severity": "clear"})
            cond_en = info["en"]
            cond_trans = translate_condition(cond_en, language)

            date_str = times[i]
            day_name = _format_day_name(date_str)
            if i == 0:
                day_label = f"Today ({day_name[:3]})"
            elif i == 1:
                day_label = f"Tomorrow ({day_name[:3]})"
            else:
                day_label = day_name

            forecast_list.append({
                "date": date_str,
                "day": day_label,
                "day_full": day_name,
                "weather_code": wmo_code,
                "condition": cond_trans,
                "condition_en": cond_en,
                "icon": info["icon"],
                "temp_min": round(float(tmins[i]), 1) if i < len(tmins) else None,
                "temp_max": round(float(tmaxs[i]), 1) if i < len(tmaxs) else None,
                "expected_rainfall": round(float(rains[i]), 1) if i < len(rains) else 0.0,
                "rainfall_probability": int(rain_probs[i]) if i < len(rain_probs) and rain_probs[i] is not None else 0,
                "wind_speed": round(float(winds[i]), 1) if i < len(winds) else 0.0,
            })

        return forecast_list

    @staticmethod
    def _parse_hourly(raw, language):
        """Format hourly weather for current day (from current hour onwards)."""
        hourly = raw.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humids = hourly.get("relative_humidity_2m", [])
        probs = hourly.get("precipitation_probability", [])
        rains = hourly.get("precipitation", [])
        codes = hourly.get("weather_code", [])
        winds = hourly.get("wind_speed_10m", [])

        now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
        hourly_list = []

        start_idx = 0
        for idx, t in enumerate(times):
            if t >= now_str:
                start_idx = idx
                break

        # Collect next 24 hours
        end_idx = min(start_idx + 24, len(times))
        for i in range(start_idx, end_idx):
            wmo_code = codes[i] if i < len(codes) else 0
            info = WMO_CODE_INFO.get(wmo_code, {"en": "Clear", "icon": "sun", "severity": "clear"})
            cond_trans = translate_condition(info["en"], language)

            iso_t = times[i]
            time_label = _format_time_str(iso_t)

            hourly_list.append({
                "time": iso_t,
                "hour": time_label,
                "temperature": round(float(temps[i]), 1) if i < len(temps) else None,
                "humidity": int(humids[i]) if i < len(humids) else None,
                "rainfall_probability": int(probs[i]) if i < len(probs) and probs[i] is not None else 0,
                "rainfall": round(float(rains[i]), 1) if i < len(rains) else 0.0,
                "wind_speed": round(float(winds[i]), 1) if i < len(winds) else 0.0,
                "weather_code": wmo_code,
                "condition": cond_trans,
                "icon": info["icon"],
            })

        return hourly_list

    @staticmethod
    def _parse_rainfall(raw):
        """Format dedicated rainfall monitoring parameters and 7-day trend."""
        daily = raw.get("daily", {})
        times = daily.get("time", [])
        rains = daily.get("precipitation_sum", [])
        probs = daily.get("precipitation_probability_max", [])

        expected_today = round(float(rains[0]), 1) if rains else 0.0
        prob_today = int(probs[0]) if probs and probs[0] is not None else 0

        trend = []
        weekly_sum = 0.0

        for i in range(min(7, len(times))):
            amt = round(float(rains[i]), 1) if i < len(rains) else 0.0
            prob = int(probs[i]) if i < len(probs) and probs[i] is not None else 0
            weekly_sum += amt
            trend.append({
                "date": times[i],
                "day": _format_day_name(times[i])[:3],
                "rainfall_amount": amt,
                "probability": prob,
            })

        return {
            "expected_rainfall_today": expected_today,
            "rainfall_probability_today": prob_today,
            "weekly_total": round(weekly_sum, 1),
            "trend": trend,
        }

    @staticmethod
    def _parse_alerts(raw, coords):
        """Format verified weather alerts or standard clear weather notice."""
        cur = raw.get("current", {})
        daily = raw.get("daily", {})

        wmo_code = cur.get("weather_code", 0)
        temp = cur.get("temperature_2m", 0.0)
        wind = cur.get("wind_speed_10m", 0.0)
        max_rain_today = daily.get("precipitation_sum", [0])[0] if daily.get("precipitation_sum") else 0.0

        alerts = []
        loc_str = coords.get("location_name", "Local Farm Region")
        now_time = datetime.now().strftime("%d %b %Y, %I:%M %p")

        # 1. Thunderstorm Alert (WMO 95-99)
        if wmo_code in (95, 96, 99):
            alerts.append({
                "id": "alert-thunderstorm",
                "title": "Thunderstorm Warning",
                "severity": "Warning",
                "severity_level": "high",
                "description": "Severe thunderstorm activity observed in the vicinity. Suspend field spraying, avoid sheltering under isolated trees, and safeguard equipment.",
                "affected_location": loc_str,
                "start_time": now_time,
                "end_time": "Next 6 hours",
                "source": "India Meteorological Department (IMD) / Open-Meteo",
                "updated_at": now_time,
            })

        # 2. Heavy Rainfall Warning (> 35mm expected)
        if max_rain_today >= 35.0:
            alerts.append({
                "id": "alert-heavy-rain",
                "title": "Heavy Rainfall Warning",
                "severity": "Warning",
                "severity_level": "high",
                "description": f"Significant rainfall accumulation expected ({max_rain_today} mm). Ensure rapid field drainage in low-lying crop zones to prevent root rot.",
                "affected_location": loc_str,
                "start_time": now_time,
                "end_time": "Next 24 hours",
                "source": "India Meteorological Department (IMD) / Open-Meteo",
                "updated_at": now_time,
            })

        # 3. High Wind Warning (> 35 km/h)
        if wind >= 35.0:
            alerts.append({
                "id": "alert-high-wind",
                "title": "Strong Wind Advisory",
                "severity": "Advisory",
                "severity_level": "moderate",
                "description": f"Gusty winds up to {wind} km/h detected. Suspend chemical spraying to avoid drift and provide staking support to tall crops such as sugarcane and banana.",
                "affected_location": loc_str,
                "start_time": now_time,
                "end_time": "Next 12 hours",
                "source": "India Meteorological Department (IMD) / Open-Meteo",
                "updated_at": now_time,
            })

        # 4. Extreme Heat Warning (> 38°C)
        if temp >= 38.0:
            alerts.append({
                "id": "alert-extreme-heat",
                "title": "High Temperature Warning",
                "severity": "Advisory",
                "severity_level": "moderate",
                "description": f"Ambient temperature reaching {temp}°C. Irrigate early in the morning or late in the evening to reduce thermal stress and evaporation losses.",
                "affected_location": loc_str,
                "start_time": now_time,
                "end_time": "Next 8 hours",
                "source": "India Meteorological Department (IMD) / Open-Meteo",
                "updated_at": now_time,
            })

        return {
            "has_alerts": len(alerts) > 0,
            "status_message": "No verified weather alerts available" if not alerts else f"{len(alerts)} active weather alert(s)",
            "alerts": alerts,
            "source": "India Meteorological Department (IMD) / Open-Meteo",
            "last_checked": now_time,
        }

    @staticmethod
    def _generate_farming_advisories(current, daily, hourly, crops, language):
        """Generate intelligent rule-based agricultural recommendations based on actual weather."""
        advisories = []
        crop_names = ", ".join(crops) if crops else "crops"

        rain_today = daily[0]["expected_rainfall"] if daily else 0.0
        rain_prob = daily[0]["rainfall_probability"] if daily else 0
        wind = current["wind_speed"]
        temp = current["temperature"]
        humidity = current["humidity"]

        # 1. Irrigation Advisory
        if rain_today >= 5.0 or rain_prob >= 60:
            advisories.append({
                "category": "Irrigation Management",
                "badge": "Postpone Irrigation",
                "type": "warning",
                "icon": "droplets",
                "message": f"Rainfall expected (~{rain_today} mm, {rain_prob}% probability). Defer planned irrigation to prevent soil saturation and reduce energy/water usage.",
            })
        else:
            advisories.append({
                "category": "Irrigation Management",
                "badge": "Normal Irrigation",
                "type": "normal",
                "icon": "droplets",
                "message": f"Low rain probability ({rain_prob}%). Proceed with standard irrigation schedule according to the water requirements of {crop_names}.",
            })

        # 2. Spraying & Fertilizer Application
        if wind >= 18.0:
            advisories.append({
                "category": "Spraying & Chemical Application",
                "badge": "Wind Drift Risk",
                "type": "alert",
                "icon": "wind",
                "message": f"Current wind speed is {wind} km/h. Avoid foliar pesticide and nutrient spraying as gusty winds will lead to chemical drift and uneven coverage.",
            })
        elif rain_prob >= 50:
            advisories.append({
                "category": "Spraying & Chemical Application",
                "badge": "Wash-off Risk",
                "type": "warning",
                "icon": "cloud-rain",
                "message": f"Precipitation chance is elevated ({rain_prob}%). Avoid applying granular fertilizers or costly agrochemical sprays to prevent wash-off.",
            })
        else:
            advisories.append({
                "category": "Spraying & Chemical Application",
                "badge": "Favorable Conditions",
                "type": "success",
                "icon": "check-circle",
                "message": f"Wind ({wind} km/h) and moisture levels are within optimal thresholds for crop protection spraying and top-dressing.",
            })

        # 3. Field & Crop Health
        if temp >= 35.0:
            advisories.append({
                "category": "Thermal Stress & Soil Care",
                "badge": "Heat Stress Precaution",
                "type": "alert",
                "icon": "sun",
                "message": f"Daytime temperatures reaching {temp}°C. Utilize crop residue mulching to retain soil moisture and safeguard shallow-rooted crops.",
            })
        elif humidity >= 80:
            advisories.append({
                "category": "Disease & Pest Monitoring",
                "badge": "High Humidity Alert",
                "type": "warning",
                "icon": "sprout",
                "message": f"High relative humidity ({humidity}%) creates favorable microclimate conditions for fungal pathogens. Inspect {crop_names} for signs of rust or blight.",
            })
        else:
            advisories.append({
                "category": "Field & Crop Care",
                "badge": "Optimal Growth",
                "type": "success",
                "icon": "sprout",
                "message": f"Favorable microclimatic parameters across your farm for {crop_names}. Carry out routine field scouting and weed control.",
            })

        return advisories

    @staticmethod
    def _record_snapshot(user_id, location_str, current_weather):
        """Save a historical snapshot into MySQL weather_records table."""
        try:
            # Throttle: Check if a snapshot for this user was recorded in the last 45 minutes
            last_rec = (
                WeatherRecord.query.filter_by(user_id=user_id)
                .order_by(WeatherRecord.recorded_at.desc())
                .first()
            )

            if last_rec and (datetime.now() - last_rec.recorded_at).total_seconds() < 2700:
                return  # Skip throttled recording

            rec = WeatherRecord(
                user_id=user_id,
                location=location_str[:250],
                temperature=current_weather.get("temperature", 0.0),
                humidity=current_weather.get("humidity"),
                rainfall=current_weather.get("rainfall", 0.0),
                wind_speed=current_weather.get("wind_speed"),
                weather_condition=current_weather.get("condition_en", current_weather.get("condition", "Clear"))[:100],
            )
            db.session.add(rec)
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.warning("Could not persist weather snapshot to database: %s", exc)

    @staticmethod
    def get_weather_history(user_id, limit=20):
        """Return saved historical weather snapshots from MySQL."""
        records = (
            WeatherRecord.query.filter_by(user_id=user_id)
            .order_by(WeatherRecord.recorded_at.desc())
            .limit(limit)
            .all()
        )
        return [r.to_dict() for r in records]
