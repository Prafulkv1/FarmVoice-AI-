"""FarmVoice AI - Farmer Context Service.

Gathers authenticated farmer profile information, Farm Diary history,
real-time agricultural weather metrics, and verified government schemes
to build a rich, context-aware prompt grounding for the AI assistant.
"""

import logging
from app import db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_crop import FarmerCrop
from app.models.farm_activities import FarmActivity
from app.models.fertilizer_records import FertilizerRecord
from app.models.pest_management_records import PestManagementRecord
from app.models.irrigation_records import IrrigationRecord
from app.models.harvest_records import HarvestRecord
from app.models.weather_record import WeatherRecord
from app.services.scheme_service import SchemeService

logger = logging.getLogger(__name__)


class FarmerContextService:
    """Retrieves and formats farmer context from MySQL database."""

    @staticmethod
    def get_farmer_context(user_id, question_text=""):
        """Collect all relevant context for the authenticated farmer.

        Returns a dictionary with profile, diary, weather, and scheme context.
        """
        context = {
            "farmer_name": "Farmer",
            "profile": None,
            "crops": [],
            "recent_activities": [],
            "recent_fertilizers": [],
            "recent_pests": [],
            "recent_irrigation": [],
            "recent_harvests": [],
            "weather": None,
            "relevant_schemes": [],
        }

        # 1. Farmer Account
        farmer = db.session.get(Farmer, user_id)
        if farmer:
            context["farmer_name"] = farmer.farm_name or farmer.username

        # 2. Farmer Profile
        profile = FarmerProfile.query.filter_by(user_id=user_id).first()
        if profile:
            profile_dict = profile.to_dict()
            if profile.full_name:
                context["farmer_name"] = profile.full_name
            context["profile"] = {
                "full_name": profile_dict.get("full_name"),
                "state": profile_dict.get("state"),
                "district": profile_dict.get("district"),
                "taluk": profile_dict.get("taluk"),
                "village": profile_dict.get("village"),
                "pin_code": profile_dict.get("pin_code"),
                "total_land_size": profile_dict.get("total_land_size"),
                "land_unit": profile_dict.get("land_unit", "Acres"),
                "soil_type": profile_dict.get("soil_type"),
                "irrigation_type": profile_dict.get("irrigation_type"),
                "farming_experience": profile_dict.get("farming_experience"),
                "preferred_language": profile_dict.get("preferred_language"),
                "main_crops": profile_dict.get("main_crops", []),
            }

        # 3. Farm Diary - Registered Crops
        try:
            crops = (
                FarmerCrop.query.filter_by(user_id=user_id)
                .order_by(FarmerCrop.created_at.desc())
                .limit(8)
                .all()
            )
            context["crops"] = [
                {
                    "crop_name": c.crop_name,
                    "crop_variety": c.crop_variety,
                    "land_area": float(c.land_area) if c.land_area else None,
                    "season": c.season,
                    "crop_status": c.crop_status,
                    "sowing_date": c.sowing_date.isoformat() if c.sowing_date else None,
                    "expected_harvest_date": (
                        c.expected_harvest_date.isoformat()
                        if c.expected_harvest_date
                        else None
                    ),
                }
                for c in crops
            ]
        except Exception as e:
            logger.warning("Error fetching farmer crops for context: %s", e)

        # 4. Farm Diary - Recent Farming Activities
        try:
            activities = (
                FarmActivity.query.filter_by(user_id=user_id)
                .order_by(FarmActivity.activity_date.desc())
                .limit(5)
                .all()
            )
            context["recent_activities"] = [
                {
                    "date": a.activity_date.isoformat() if a.activity_date else None,
                    "type": a.activity_type,
                    "description": a.activity_description,
                }
                for a in activities
            ]
        except Exception as e:
            logger.warning("Error fetching farm activities for context: %s", e)

        # 5. Farm Diary - Recent Fertilizer Applications
        try:
            ferts = (
                FertilizerRecord.query.filter_by(user_id=user_id)
                .order_by(FertilizerRecord.application_date.desc())
                .limit(5)
                .all()
            )
            context["recent_fertilizers"] = [
                {
                    "date": f.application_date.isoformat() if f.application_date else None,
                    "name": f.fertilizer_name,
                    "type": f.fertilizer_type,
                    "quantity": float(f.quantity_used) if f.quantity_used else None,
                }
                for f in ferts
            ]
        except Exception as e:
            logger.warning("Error fetching fertilizer records for context: %s", e)

        # 6. Farm Diary - Recent Pest & Disease Records
        try:
            pests = (
                PestManagementRecord.query.filter_by(user_id=user_id)
                .order_by(PestManagementRecord.application_or_observation_date.desc())
                .limit(5)
                .all()
            )
            context["recent_pests"] = [
                {
                    "date": (
                        p.application_or_observation_date.isoformat()
                        if p.application_or_observation_date
                        else None
                    ),
                    "type": p.record_type,
                    "pest_or_disease": p.pest_or_disease_name,
                    "pesticide": p.pesticide_name,
                }
                for p in pests
            ]
        except Exception as e:
            logger.warning("Error fetching pest records for context: %s", e)

        # 7. Farm Diary - Recent Irrigation Records
        try:
            irrigations = (
                IrrigationRecord.query.filter_by(user_id=user_id)
                .order_by(IrrigationRecord.irrigation_date.desc())
                .limit(5)
                .all()
            )
            context["recent_irrigation"] = [
                {
                    "date": i.irrigation_date.isoformat() if i.irrigation_date else None,
                    "method": i.irrigation_method,
                    "duration": i.duration,
                    "water_usage": float(i.water_usage) if i.water_usage else None,
                }
                for i in irrigations
            ]
        except Exception as e:
            logger.warning("Error fetching irrigation records for context: %s", e)

        # 8. Farm Diary - Recent Harvest Records
        try:
            harvests = (
                HarvestRecord.query.filter_by(user_id=user_id)
                .order_by(HarvestRecord.harvest_date.desc())
                .limit(4)
                .all()
            )
            context["recent_harvests"] = [
                {
                    "date": h.harvest_date.isoformat() if h.harvest_date else None,
                    "quantity": float(h.quantity_harvested) if h.quantity_harvested else None,
                    "unit": h.quantity_unit,
                    "grade": h.quality_or_grade,
                }
                for h in harvests
            ]
        except Exception as e:
            logger.warning("Error fetching harvest records for context: %s", e)

        # 9. Weather Context (Live snapshot or database record)
        try:
            from app.services.weather_service import WeatherService

            if profile and profile.district:
                weather_res = WeatherService.get_all_weather(user_id, profile, force_refresh=False)
                weather_data = weather_res[0] if isinstance(weather_res, tuple) else weather_res
                if weather_data and isinstance(weather_data, dict) and weather_data.get("current"):
                    curr = weather_data["current"]
                    context["weather"] = {
                        "location": curr.get("location_name") or f"{profile.district}, {profile.state}",
                        "temperature": curr.get("temperature"),
                        "condition": curr.get("condition"),
                        "humidity": curr.get("humidity"),
                        "rainfall": curr.get("rainfall"),
                        "wind_speed": curr.get("wind_speed"),
                        "forecast_summary": weather_data.get("daily", [])[:3],
                        "source": "Open-Meteo Meteorological Service",
                    }
        except Exception as e:
            logger.warning("Live weather retrieval failed, falling back to database record: %s", e)

        if not context["weather"]:
            # Fallback to last recorded weather snapshot in MySQL
            try:
                last_rec = (
                    WeatherRecord.query.filter_by(user_id=user_id)
                    .order_by(WeatherRecord.recorded_at.desc())
                    .first()
                )
                if last_rec:
                    context["weather"] = {
                        "location": last_rec.location,
                        "temperature": float(last_rec.temperature) if last_rec.temperature else None,
                        "condition": last_rec.weather_condition,
                        "humidity": last_rec.humidity,
                        "rainfall": float(last_rec.rainfall) if last_rec.rainfall else 0.0,
                        "wind_speed": float(last_rec.wind_speed) if last_rec.wind_speed else None,
                        "recorded_at": (
                            last_rec.recorded_at.isoformat()
                            if last_rec.recorded_at
                            else None
                        ),
                        "source": "Recorded Local Weather Record",
                    }
            except Exception as e:
                logger.warning("Database weather fallback failed: %s", e)

        # 10. Verified Government Schemes (if matched by question)
        if question_text:
            matched_schemes = SchemeService.search_schemes(question_text, max_results=3)
            context["relevant_schemes"] = matched_schemes

        return context

    @staticmethod
    def format_context_for_prompt(context):
        """Format the collected context into a concise, factual text block for the LLM."""
        lines = []

        # Farmer profile
        prof = context.get("profile") or {}
        lines.append(f"Farmer Name: {context.get('farmer_name', 'Farmer')}")

        if prof.get("state") or prof.get("district"):
            loc_parts = [
                prof.get("village"),
                prof.get("taluk"),
                prof.get("district"),
                prof.get("state"),
            ]
            loc_str = ", ".join([p for p in loc_parts if p])
            lines.append(f"Location: {loc_str}")
        else:
            lines.append("Location: Location not yet saved in profile")

        if prof.get("total_land_size"):
            lines.append(f"Land Size: {prof.get('total_land_size')} {prof.get('land_unit', 'Acres')}")
        if prof.get("soil_type"):
            lines.append(f"Soil Type: {prof.get('soil_type')}")
        if prof.get("irrigation_type"):
            lines.append(f"Irrigation System: {prof.get('irrigation_type')}")
        if prof.get("farming_experience") is not None:
            lines.append(f"Farming Experience: {prof.get('farming_experience')} years")
        if prof.get("main_crops"):
            lines.append(f"Preferred Crops (from profile): {', '.join(prof.get('main_crops'))}")

        # Farm Diary Crops
        crops = context.get("crops") or []
        if crops:
            crop_summaries = []
            for c in crops:
                item = f"{c['crop_name']}"
                if c.get("crop_variety"):
                    item += f" ({c['crop_variety']})"
                if c.get("crop_status"):
                    item += f" - Status: {c['crop_status']}"
                if c.get("season"):
                    item += f", Season: {c['season']}"
                crop_summaries.append(item)
            lines.append(f"Active Farm Crops: {'; '.join(crop_summaries)}")

        # Farm Diary Recent History
        activities = context.get("recent_activities") or []
        if activities:
            act_str = "; ".join([f"{a['date']}: {a['type']} - {a['description']}" for a in activities[:3]])
            lines.append(f"Recent Farm Activities: {act_str}")

        ferts = context.get("recent_fertilizers") or []
        if ferts:
            fert_str = "; ".join([f"{f['date']}: {f['name']} ({f['quantity']} units)" for f in ferts[:3]])
            lines.append(f"Recent Fertilizer Usage: {fert_str}")

        pests = context.get("recent_pests") or []
        if pests:
            pest_str = "; ".join([f"{p['date']}: {p['pest_or_disease']} ({p.get('pesticide') or 'Observed'})" for p in pests[:3]])
            lines.append(f"Recent Pest/Disease Records: {pest_str}")

        irrig = context.get("recent_irrigation") or []
        if irrig:
            irrig_str = "; ".join([f"{i['date']}: {i['method']} for {i['duration']}" for i in irrig[:3]])
            lines.append(f"Recent Irrigation: {irrig_str}")

        # Weather
        weather = context.get("weather")
        if weather:
            w_str = f"{weather.get('condition', 'Clear')}, {weather.get('temperature', 'N/A')}°C, Humidity: {weather.get('humidity', 'N/A')}%, Rainfall: {weather.get('rainfall', 0)}mm, Wind: {weather.get('wind_speed', 'N/A')} km/h (Source: {weather.get('source', 'Meteorological data')})"
            lines.append(f"Current Local Weather: {w_str}")

        # Government schemes
        schemes = context.get("relevant_schemes") or []
        if schemes:
            scheme_lines = []
            for s in schemes:
                scheme_lines.append(
                    f"- {s['name']}: Benefit: {s['benefit']} | Eligibility: {s['eligibility']} | Portal: {s['link']}"
                )
            lines.append("Verified Government Schemes Relevant to Query:\n" + "\n".join(scheme_lines))

        return "\n".join(lines)
