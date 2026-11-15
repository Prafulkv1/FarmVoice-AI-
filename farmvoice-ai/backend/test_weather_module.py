"""Unit and Integration Tests for FarmVoice AI Weather Module."""

import unittest
from flask_jwt_extended import create_access_token, get_csrf_token
from werkzeug.security import generate_password_hash
import time

from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop
from app.models.weather_record import WeatherRecord


class WeatherModuleTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            suffix = str(int(time.time() * 1000))[-6:]

            # Farmer 1: Complete location (Mudhol, Bagalkot, Karnataka)
            f1 = Farmer(
                farm_name=f"Mudhol Farm {suffix}",
                username=f"weather_farmer1_{suffix}",
                email=f"wfarmer1_{suffix}@test.com",
                mobile_number="9876543210",
                password_hash=generate_password_hash("Pass@123"),
            )
            # Farmer 2: No profile / incomplete location
            f2 = Farmer(
                farm_name=f"Incomplete Farm {suffix}",
                username=f"weather_farmer2_{suffix}",
                email=f"wfarmer2_{suffix}@test.com",
                mobile_number="9876543211",
                password_hash=generate_password_hash("Pass@123"),
            )
            db.session.add_all([f1, f2])
            db.session.commit()
            cls.farmer1_id = f1.farmer_id
            cls.farmer2_id = f2.farmer_id

            # Create profile for Farmer 1 with crops and location
            p1 = FarmerProfile(
                user_id=cls.farmer1_id,
                full_name="Mahadevappa Patil",
                mobile_number="9876543210",
                state="Karnataka",
                district="Bagalkot",
                taluk="Mudhol",
                village="Lokapur",
                pin_code="587122",
                total_land_size=7.5,
                land_unit="Acres",
                soil_type="Black Soil",
                irrigation_type="Canal",
                farming_experience=18,
                preferred_language="Kannada",
                notifications_enabled=True,
            )
            db.session.add(p1)
            db.session.flush()
            db.session.add(FarmerProfileCrop(profile_id=p1.profile_id, crop_name="Sugarcane"))
            db.session.add(FarmerProfileCrop(profile_id=p1.profile_id, crop_name="Maize"))
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

    def test_01_unauthenticated_access_rejected(self):
        """Unauthenticated requests to weather endpoints must return 401."""
        anon = self.app.test_client()
        self.assertEqual(anon.get("/api/weather/current").status_code, 401)
        self.assertEqual(anon.get("/api/weather/forecast").status_code, 401)
        self.assertEqual(anon.get("/api/weather/hourly").status_code, 401)
        self.assertEqual(anon.get("/api/weather/alerts").status_code, 401)
        self.assertEqual(anon.get("/api/weather/history").status_code, 401)

    def test_02_incomplete_location_prompts_profile_completion(self):
        """Farmer without location details receives 400 PROFILE_LOCATION_REQUIRED."""
        headers = self._auth_headers(self.farmer2_id)
        res = self.client.get("/api/weather/current", headers=headers)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data.get("error"), "PROFILE_LOCATION_REQUIRED")
        self.assertIn("complete your farm location", data["message"])

    def test_03_current_weather_endpoint(self):
        """GET /api/weather/current returns real live weather based on saved location."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/weather/current", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        cur = data["current"]

        # Verify essential current weather parameters
        self.assertIn("temperature", cur)
        self.assertIsInstance(cur["temperature"], (int, float))
        self.assertIn("humidity", cur)
        self.assertIn("wind_speed", cur)
        self.assertIn("wind_direction", cur)
        self.assertIn("rainfall", cur)
        self.assertIn("pressure", cur)
        self.assertIn("cloud_cover", cur)
        self.assertIn("sunrise", cur)
        self.assertIn("sunset", cur)
        self.assertIn("condition", cur)
        self.assertIn("last_updated", cur)

        # Location verified from farmer profile
        self.assertIn("Bagalkot", data["location"]["location_name"])

    def test_04_seven_day_forecast_endpoint(self):
        """GET /api/weather/forecast returns 7-day forecast."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/weather/forecast", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        daily = data["daily_forecast"]
        self.assertEqual(len(daily), 7)

        for day in daily:
            self.assertIn("date", day)
            self.assertIn("day", day)
            self.assertIn("temp_min", day)
            self.assertIn("temp_max", day)
            self.assertIn("rainfall_probability", day)
            self.assertIn("expected_rainfall", day)
            self.assertIn("condition", day)
            self.assertIn("icon", day)

    def test_05_hourly_forecast_endpoint(self):
        """GET /api/weather/hourly returns hourly forecast."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/weather/hourly", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        hourly = data["hourly_forecast"]
        self.assertGreaterEqual(len(hourly), 12)

        first_hour = hourly[0]
        self.assertIn("hour", first_hour)
        self.assertIn("temperature", first_hour)
        self.assertIn("humidity", first_hour)
        self.assertIn("rainfall_probability", first_hour)
        self.assertIn("wind_speed", first_hour)

    def test_06_weather_alerts_endpoint(self):
        """GET /api/weather/alerts returns verified alerts or clear status notice."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/weather/alerts", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        alerts_obj = data["alerts"]
        self.assertIn("status_message", alerts_obj)
        self.assertIn("alerts", alerts_obj)
        self.assertIn("source", alerts_obj)

    def test_07_weather_history_endpoint(self):
        """GET /api/weather/history returns historical records stored in MySQL."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/weather/history", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["history"], list)

    def test_08_all_weather_data_bundle(self):
        """GET /api/weather/all returns combined weather, rainfall, alerts & crop advisories."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/weather/all", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

        # Check rainfall monitoring
        self.assertIn("rainfall", data)
        self.assertIn("expected_rainfall_today", data["rainfall"])
        self.assertIn("trend", data["rainfall"])

        # Check agricultural advisories
        self.assertIn("advisories", data)
        self.assertGreater(len(data["advisories"]), 0)
        for adv in data["advisories"]:
            self.assertIn("category", adv)
            self.assertIn("message", adv)
            self.assertIn("badge", adv)


if __name__ == "__main__":
    unittest.main()
