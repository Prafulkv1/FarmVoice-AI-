"""FarmVoice AI - Geocoding Service.

Resolves farmer location (Village, Taluk, District, State, PIN Code) into
precise geographic coordinates (latitude, longitude) for weather fetching.
Uses Open-Meteo Geocoding API with sensible in-memory caching and a built-in
regional fallback coordinates directory covering Karnataka and key Indian districts.
"""

import json
import logging
import urllib.parse
import urllib.request

logger = logging.getLogger(__name__)

# In-memory geocoding cache: { location_key: { "latitude": float, "longitude": float, "display_name": str } }
_GEOCODE_CACHE = {}

# Comprehensive coordinates directory for Karnataka and major Indian agricultural centers
REGIONAL_FALLBACK_COORDINATES = {
    # Karnataka Districts & Taluks
    "mudhol": {"lat": 16.3335, "lon": 75.2831, "name": "Mudhol, Bagalkot, Karnataka"},
    "bagalkot": {"lat": 16.1867, "lon": 75.6961, "name": "Bagalkot, Karnataka"},
    "bagalkote": {"lat": 16.1867, "lon": 75.6961, "name": "Bagalkot, Karnataka"},
    "belagavi": {"lat": 15.8497, "lon": 74.4977, "name": "Belagavi, Karnataka"},
    "belgaum": {"lat": 15.8497, "lon": 74.4977, "name": "Belagavi, Karnataka"},
    "chikkodi": {"lat": 16.4300, "lon": 74.5900, "name": "Chikkodi, Belagavi, Karnataka"},
    "gokak": {"lat": 16.1667, "lon": 74.8333, "name": "Gokak, Belagavi, Karnataka"},
    "mandya": {"lat": 12.5223, "lon": 76.8975, "name": "Mandya, Karnataka"},
    "maddur": {"lat": 12.5842, "lon": 77.0425, "name": "Maddur, Mandya, Karnataka"},
    "pandavapura": {"lat": 12.5000, "lon": 76.6667, "name": "Pandavapura, Mandya, Karnataka"},
    "hassan": {"lat": 13.0033, "lon": 76.1004, "name": "Hassan, Karnataka"},
    "arasikere": {"lat": 13.3142, "lon": 76.2572, "name": "Arasikere, Hassan, Karnataka"},
    "dharwad": {"lat": 15.4589, "lon": 75.0078, "name": "Dharwad, Karnataka"},
    "hubballi": {"lat": 15.3647, "lon": 75.1240, "name": "Hubballi, Dharwad, Karnataka"},
    "hubli": {"lat": 15.3647, "lon": 75.1240, "name": "Hubballi, Dharwad, Karnataka"},
    "mysuru": {"lat": 12.2958, "lon": 76.6394, "name": "Mysuru, Karnataka"},
    "mysore": {"lat": 12.2958, "lon": 76.6394, "name": "Mysuru, Karnataka"},
    "nanjangud": {"lat": 12.1194, "lon": 76.6800, "name": "Nanjangud, Mysuru, Karnataka"},
    "ballari": {"lat": 15.1394, "lon": 76.9214, "name": "Ballari, Karnataka"},
    "bellary": {"lat": 15.1394, "lon": 76.9214, "name": "Ballari, Karnataka"},
    "kalaburagi": {"lat": 17.3297, "lon": 76.8343, "name": "Kalaburagi, Karnataka"},
    "gulbarga": {"lat": 17.3297, "lon": 76.8343, "name": "Kalaburagi, Karnataka"},
    "vijayapura": {"lat": 16.8302, "lon": 75.7100, "name": "Vijayapura, Karnataka"},
    "bijapur": {"lat": 16.8302, "lon": 75.7100, "name": "Vijayapura, Karnataka"},
    "raichur": {"lat": 16.2076, "lon": 77.3463, "name": "Raichur, Karnataka"},
    "shivamogga": {"lat": 13.9299, "lon": 75.5681, "name": "Shivamogga, Karnataka"},
    "shimoga": {"lat": 13.9299, "lon": 75.5681, "name": "Shivamogga, Karnataka"},
    "davanagere": {"lat": 14.4644, "lon": 75.9218, "name": "Davanagere, Karnataka"},
    "tumakuru": {"lat": 13.3379, "lon": 77.1173, "name": "Tumakuru, Karnataka"},
    "tumkur": {"lat": 13.3379, "lon": 77.1173, "name": "Tumakuru, Karnataka"},
    "kolar": {"lat": 13.1367, "lon": 78.1292, "name": "Kolar, Karnataka"},
    "chikkamagaluru": {"lat": 13.3161, "lon": 75.7720, "name": "Chikkamagaluru, Karnataka"},
    "udupi": {"lat": 13.3409, "lon": 74.7421, "name": "Udupi, Karnataka"},
    "mangaluru": {"lat": 12.9141, "lon": 74.8560, "name": "Mangaluru, Karnataka"},
    "mangalore": {"lat": 12.9141, "lon": 74.8560, "name": "Mangaluru, Karnataka"},
    "karwar": {"lat": 14.8136, "lon": 74.1298, "name": "Karwar, Karnataka"},
    "gadag": {"lat": 15.4167, "lon": 75.6333, "name": "Gadag, Karnataka"},
    "haveri": {"lat": 14.7954, "lon": 75.3991, "name": "Haveri, Karnataka"},
    "koppal": {"lat": 15.3486, "lon": 76.1558, "name": "Koppal, Karnataka"},
    "yadgir": {"lat": 16.7629, "lon": 77.1378, "name": "Yadgir, Karnataka"},
    "bidar": {"lat": 17.9104, "lon": 77.5199, "name": "Bidar, Karnataka"},
    "chamarajanagar": {"lat": 11.9261, "lon": 76.9437, "name": "Chamarajanagar, Karnataka"},
    "ramanagara": {"lat": 12.7150, "lon": 77.2814, "name": "Ramanagara, Karnataka"},
    "chikkaballapura": {"lat": 13.4325, "lon": 77.7275, "name": "Chikkaballapura, Karnataka"},
    "madikeri": {"lat": 12.4244, "lon": 75.7382, "name": "Madikeri, Kodagu, Karnataka"},
    "kodagu": {"lat": 12.4244, "lon": 75.7382, "name": "Kodagu, Karnataka"},
    "chitradurga": {"lat": 14.2251, "lon": 76.3980, "name": "Chitradurga, Karnataka"},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru, Karnataka"},
    "bangalore": {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru, Karnataka"},
    # Other Major Indian Agricultural Hubs
    "pune": {"lat": 18.5204, "lon": 73.8567, "name": "Pune, Maharashtra"},
    "nashik": {"lat": 19.9975, "lon": 73.7898, "name": "Nashik, Maharashtra"},
    "nagpur": {"lat": 21.1458, "lon": 79.0882, "name": "Nagpur, Maharashtra"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "name": "Hyderabad, Telangana"},
    "guntur": {"lat": 16.3067, "lon": 80.4365, "name": "Guntur, Andhra Pradesh"},
    "kurnool": {"lat": 15.8281, "lon": 78.0373, "name": "Kurnool, Andhra Pradesh"},
    "coimbatore": {"lat": 11.0168, "lon": 76.9558, "name": "Coimbatore, Tamil Nadu"},
    "madurai": {"lat": 9.9252, "lon": 78.1198, "name": "Madurai, Tamil Nadu"},
    "ludhiana": {"lat": 30.9010, "lon": 75.8573, "name": "Ludhiana, Punjab"},
    "amritsar": {"lat": 31.6340, "lon": 74.8723, "name": "Amritsar, Punjab"},
}


class GeocodingService:
    """Provides coordinate lookup for farmer profile location strings."""

    @staticmethod
    def get_coordinates(village="", taluk="", district="", state="Karnataka", pin_code=""):
        """Resolve geographic coordinates for a given farm location.

        Returns:
            dict with latitude (float), longitude (float), location_name (str), source (str)
        """
        v_clean = (village or "").strip()
        t_clean = (taluk or "").strip()
        d_clean = (district or "").strip()
        s_clean = (state or "Karnataka").strip()

        # Cache key based on most specific available terms
        cache_key = f"{v_clean}|{t_clean}|{d_clean}|{s_clean}".lower()
        if cache_key in _GEOCODE_CACHE:
            return _GEOCODE_CACHE[cache_key]

        # 1. Try Live Geocoding via Open-Meteo Geocoding API
        search_terms = []
        if t_clean:
            search_terms.append(t_clean)
        elif v_clean:
            search_terms.append(v_clean)
        if d_clean and d_clean.lower() != t_clean.lower():
            search_terms.append(d_clean)

        # Fallback search query if no specific taluk/village is given
        primary_query = search_terms[0] if search_terms else (d_clean or s_clean)

        live_result = GeocodingService._query_open_meteo_geocoding(primary_query, s_clean, d_clean)
        if live_result:
            # Construct a human-readable display location
            display_parts = [p for p in [v_clean, t_clean, d_clean, s_clean] if p]
            display_str = ", ".join(display_parts) if display_parts else live_result["name"]
            res = {
                "latitude": live_result["latitude"],
                "longitude": live_result["longitude"],
                "location_name": display_str,
                "resolved_city": live_result.get("name", d_clean),
                "source": "open-meteo-geocoding",
            }
            _GEOCODE_CACHE[cache_key] = res
            return res

        # 2. Check Regional Fallback Directory
        for key in [t_clean.lower(), d_clean.lower(), v_clean.lower()]:
            if key and key in REGIONAL_FALLBACK_COORDINATES:
                match = REGIONAL_FALLBACK_COORDINATES[key]
                display_parts = [p for p in [v_clean, t_clean, d_clean, s_clean] if p]
                display_str = ", ".join(display_parts) if display_parts else match["name"]
                res = {
                    "latitude": match["lat"],
                    "longitude": match["lon"],
                    "location_name": display_str,
                    "resolved_city": match["name"].split(",")[0],
                    "source": "regional-directory",
                }
                _GEOCODE_CACHE[cache_key] = res
                return res

        # 3. Default fallback for Karnataka state capital if unmatched
        default_res = {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "location_name": f"{d_clean or 'Central'}, {s_clean or 'Karnataka'}",
            "resolved_city": d_clean or "Bengaluru",
            "source": "state-fallback",
        }
        _GEOCODE_CACHE[cache_key] = default_res
        return default_res

    @staticmethod
    def _query_open_meteo_geocoding(query_term, target_state, target_district):
        """Query the Open-Meteo Geocoding REST API with timeout and safe error handling."""
        if not query_term:
            return None

        try:
            encoded = urllib.parse.quote(query_term)
            url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded}&count=8&language=en&format=json"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "FarmVoiceAI-Weather/1.0", "Accept": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    results = data.get("results", [])
                    if not results:
                        return None

                    # Prefer an Indian result that matches target state or district
                    target_state_lower = (target_state or "").lower()
                    target_dist_lower = (target_district or "").lower()

                    for r in results:
                        if r.get("country_code") == "IN":
                            admin1 = (r.get("admin1") or "").lower()
                            admin2 = (r.get("admin2") or "").lower()
                            if (
                                target_state_lower in admin1
                                or target_dist_lower in admin2
                                or target_dist_lower in admin1
                            ):
                                return r

                    # If no state match found, return first Indian result if any
                    for r in results:
                        if r.get("country_code") == "IN":
                            return r

                    # Fall back to first result
                    return results[0]
        except Exception as exc:
            logger.warning("Open-Meteo geocoding query failed for '%s': %s", query_term, exc)
            return None
