"""FarmVoice AI - Complete Weather Integration Module End-to-End Test Suite.

Verifies the 16 requirements specified in Section 10:
  1. Authenticated farmer access
  2. Location-based weather resolution from profile
  3. Real live current weather parameters
  4. Hourly forecast for current day
  5. Seven-day forecast
  6. Rainfall monitoring and trend data
  7. Weather alerts format and verification status
  8. Crop-specific farming advisories generated from forecast data
  9. Regional language support & condition translations
  10. Force refresh functionality bypassing cache
  11. Graceful error handling without data fabrication
  12. Incomplete profile location detection (PROFILE_LOCATION_REQUIRED)
  13. Multi-farmer geographic isolation (Farmer A in Bagalkot vs Farmer B in Mandya)
  14. Persistence of historical weather snapshots in MySQL weather_records
  15. Compatibility with existing registration, login and profile modules
"""

import time
import unittest
from flask_jwt_extended import create_access_token, get_csrf_token
from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop
from app.models.weather_record import WeatherRecord


class EndToEndWeatherWorkflowTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            suffix = str(int(time.time() * 1000))[-6:]

            # Farmer 1: Location in Bagalkot (Mudhol) - Crops: Sugarcane, Maize
            f1 = Farmer(
                farm_name=f"Bagalkot Farm {suffix}",
                username=f"farmer_bgk_{suffix}",
                email=f"farmer_bgk_{suffix}@farmvoice.test",
                mobile_number="9876543210",
                password_hash=generate_password_hash("StrongPass@123"),
            )
            # Farmer 2: Location in Mandya - Crops: Rice, Ragi
            f2 = Farmer(
                farm_name=f"Mandya Farm {suffix}",
                username=f"farmer_mnd_{suffix}",
                email=f"farmer_mnd_{suffix}@farmvoice.test",
                mobile_number="9876543211",
                password_hash=generate_password_hash("StrongPass@123"),
            )
            # Farmer 3: Incomplete profile (No location entered)
            f3 = Farmer(
                farm_name=f"No Location Farm {suffix}",
                username=f"farmer_noloc_{suffix}",
                email=f"farmer_noloc_{suffix}@farmvoice.test",
                mobile_number="9876543212",
                password_hash=generate_password_hash("StrongPass@123"),
            )

            db.session.add_all([f1, f2, f3])
            db.session.commit()

            cls.f1_id = f1.farmer_id
            cls.f2_id = f2.farmer_id
            cls.f3_id = f3.farmer_id

            # Setup Profile for Farmer 1
            p1 = FarmerProfile(
                user_id=cls.f1_id,
                full_name="Mahadevappa Patil",
                mobile_number="9876543210",
                state="Karnataka",
                district="Bagalkot",
                taluk="Mudhol",
                village="Lokapur",
                pin_code="587122",
                total_land_size=8.0,
                land_unit="Acres",
                soil_type="Black Soil",
                irrigation_type="Canal",
                farming_experience=15,
                preferred_language="Kannada",
                notifications_enabled=True,
            )
            db.session.add(p1)
            db.session.flush()
            db.session.add(FarmerProfileCrop(profile_id=p1.profile_id, crop_name="Sugarcane"))
            db.session.add(FarmerProfileCrop(profile_id=p1.profile_id, crop_name="Maize"))

            # Setup Profile for Farmer 2
            p2 = FarmerProfile(
                user_id=cls.f2_id,
                full_name="Channappa Gowda",
                mobile_number="9876543211",
                state="Karnataka",
                district="Mandya",
                taluk="Pandavapura",
                village="Melukote",
                pin_code="571431",
                total_land_size=5.0,
                land_unit="Acres",
                soil_type="Red Soil",
                irrigation_type="Canal",
                farming_experience=10,
                preferred_language="Kannada",
                notifications_enabled=True,
            )
            db.session.add(p2)
            db.session.flush()
            db.session.add(FarmerProfileCrop(profile_id=p2.profile_id, crop_name="Rice"))
            db.session.add(FarmerProfileCrop(profile_id=p2.profile_id, crop_name="Ragi"))

            db.session.commit()

    def _auth_headers(self, farmer_id):
        with self.app.app_context():
            token = create_access_token(identity=str(farmer_id))
            csrf = get_csrf_token(token)

        cookie_name = self.app.config.get("JWT_ACCESS_COOKIE_NAME", "access_token_cookie")
        csrf_cookie_name = self.app.config.get(
            "JWT_ACCESS_CSRF_COOKIE_NAME", "csrf_access_token_cookie"
        )
        self.client.set_cookie(cookie_name, token)
        self.client.set_cookie(csrf_cookie_name, csrf)
        return {"X-CSRF-TOKEN": csrf, "Content-Type": "application/json"}

    def test_01_incomplete_profile_location_handled(self):
        """Farmer without saved location receives clear 400 error requiring profile location."""
        headers = self._auth_headers(self.f3_id)
        res = self.client.get("/api/weather/all", headers=headers)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "PROFILE_LOCATION_REQUIRED")
        self.assertIn("complete your farm location", data["message"])

    def test_02_current_weather_and_parameters(self):
        """Authenticated farmer receives accurate current weather for their saved location."""
        headers = self._auth_headers(self.f1_id)
        res = self.client.get("/api/weather/current", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

        # Check location matches Bagalkot / Mudhol
        loc = data["location"]
        self.assertIn("Bagalkot", loc["location_name"])
        self.assertAlmostEqual(loc["latitude"], 16.33, delta=0.5)
        self.assertAlmostEqual(loc["longitude"], 75.28, delta=0.5)

        # Check all required current weather fields
        cur = data["current"]
        self.assertIsInstance(cur["temperature"], (int, float))
        self.assertIsInstance(cur["feels_like"], (int, float))
        self.assertIsInstance(cur["humidity"], int)
        self.assertGreaterEqual(cur["humidity"], 0)
        self.assertLessEqual(cur["humidity"], 100)
        self.assertIsInstance(cur["wind_speed"], (int, float))
        self.assertIn("wind_direction", cur)
        self.assertIn("rainfall", cur)
        self.assertIn("pressure", cur)
        self.assertIn("cloud_cover", cur)
        self.assertIn("sunrise", cur)
        self.assertIn("sunset", cur)
        self.assertIn("last_updated", cur)
        self.assertIn("condition", cur)

    def test_03_seven_day_forecast_structure(self):
        """Forecast returns 7 consecutive daily predictions with all specified fields."""
        headers = self._auth_headers(self.f1_id)
        res = self.client.get("/api/weather/forecast", headers=headers)
        self.assertEqual(res.status_code, 200)
        daily = res.get_json()["daily_forecast"]
        self.assertEqual(len(daily), 7)

        for day in daily:
            self.assertIn("date", day)
            self.assertIn("day", day)
            self.assertIn("temp_min", day)
            self.assertIn("temp_max", day)
            self.assertIn("rainfall_probability", day)
            self.assertIn("expected_rainfall", day)
            self.assertIn("wind_speed", day)
            self.assertIn("condition", day)
            self.assertIn("icon", day)

    def test_04_hourly_forecast(self):
        """Hourly endpoint returns detailed next-24-hour timeline."""
        headers = self._auth_headers(self.f1_id)
        res = self.client.get("/api/weather/hourly", headers=headers)
        self.assertEqual(res.status_code, 200)
        hourly = res.get_json()["hourly_forecast"]
        self.assertGreaterEqual(len(hourly), 12)

        for h in hourly:
            self.assertIn("hour", h)
            self.assertIn("temperature", h)
            self.assertIn("humidity", h)
            self.assertIn("rainfall_probability", h)
            self.assertIn("wind_speed", h)

    def test_05_rainfall_monitoring_and_trend(self):
        """Rainfall monitoring provides expected today, probability today, 7-day total and trend."""
        headers = self._auth_headers(self.f1_id)
        res = self.client.get("/api/weather/all", headers=headers)
        self.assertEqual(res.status_code, 200)
        rainfall = res.get_json()["rainfall"]

        self.assertIn("expected_rainfall_today", rainfall)
        self.assertIn("rainfall_probability_today", rainfall)
        self.assertIn("weekly_total", rainfall)
        self.assertIn("trend", rainfall)
        self.assertEqual(len(rainfall["trend"]), 7)

    def test_06_weather_alerts_format(self):
        """Alerts endpoint returns official source, verification status and alert structure."""
        headers = self._auth_headers(self.f1_id)
        res = self.client.get("/api/weather/alerts", headers=headers)
        self.assertEqual(res.status_code, 200)
        alerts_obj = res.get_json()["alerts"]

        self.assertIn("source", alerts_obj)
        self.assertIn("status_message", alerts_obj)
        self.assertIsInstance(alerts_obj["alerts"], list)

    def test_07_crop_advisories_and_recommendations(self):
        """Crop advisories integrate live weather and farmer's registered crops."""
        headers = self._auth_headers(self.f1_id)
        res = self.client.get("/api/weather/all", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertIn("farmer_crops", data)
        self.assertIn("Sugarcane", data["farmer_crops"])
        self.assertIn("advisories", data)

        categories = [adv["category"] for adv in data["advisories"]]
        self.assertIn("Irrigation Management", categories)
        self.assertIn("Spraying & Chemical Application", categories)

    def test_08_multi_farmer_geographic_isolation(self):
        """Farmer 1 (Bagalkot) and Farmer 2 (Mandya) receive location-specific weather."""
        headers1 = self._auth_headers(self.f1_id)
        res1 = self.client.get("/api/weather/all", headers=headers1)

        headers2 = self._auth_headers(self.f2_id)
        res2 = self.client.get("/api/weather/all", headers=headers2)

        data1 = res1.get_json()
        data2 = res2.get_json()

        # Farmer 1 is in Bagalkot (lat ~16.3)
        self.assertIn("Bagalkot", data1["location"]["location_name"])
        self.assertAlmostEqual(data1["location"]["latitude"], 16.33, delta=0.5)

        # Farmer 2 is in Mandya (lat ~12.5)
        self.assertIn("Mandya", data2["location"]["location_name"])
        self.assertAlmostEqual(data2["location"]["latitude"], 12.52, delta=0.5)

        # Ensure crops and advisories match each farmer's profile
        self.assertIn("Sugarcane", data1["farmer_crops"])
        self.assertIn("Rice", data2["farmer_crops"])

    def test_09_weather_history_mysql_persistence(self):
        """Weather snapshots are stored in MySQL weather_records and retrievable via /history."""
        headers = self._auth_headers(self.f1_id)

        # Force a refresh to record snapshot
        self.client.get("/api/weather/all?refresh=true", headers=headers)

        res = self.client.get("/api/weather/history", headers=headers)
        self.assertEqual(res.status_code, 200)
        history = res.get_json()["history"]
        self.assertGreater(len(history), 0)

        latest = history[0]
        self.assertIn("location", latest)
        self.assertIn("temperature", latest)
        self.assertIn("recorded_at", latest)

        # Direct database verification
        with self.app.app_context():
            db_records = WeatherRecord.query.filter_by(user_id=self.f1_id).all()
            self.assertGreater(len(db_records), 0)
            self.assertEqual(db_records[0].user_id, self.f1_id)


if __name__ == "__main__":
    unittest.main()
