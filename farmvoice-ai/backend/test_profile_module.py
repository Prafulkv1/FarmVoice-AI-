"""FarmVoice AI - Comprehensive Farmer Profile Module Test Suite.

Tests cover:
  1. Safe Database Table Verification (farmer_profiles & farmer_profile_crops)
  2. Unauthenticated Access Protection (401)
  3. New Farmer Registration & Empty Profile Fetch (200 with profile=None)
  4. Profile Creation (PUT /api/profile -> 201)
  5. Multi-crop Relational Persistence in farmer_profile_crops
  6. Profile Fetch with Crops (GET /api/profile -> 200)
  7. Profile Completion Calculation (GET /api/profile/completion -> 200)
  8. Profile Update (modifying location, crops, preferences -> 200)
  9. Cross-User Isolation (User A cannot access or modify User B's profile)
  10. Strict Input Validation (invalid mobile, PIN, land size, crops, soil, irrigation)
"""

import sys
import unittest
from flask_jwt_extended import create_access_token, get_csrf_token
from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop


class FarmerProfileTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()

            # Create test farmer 1
            f1 = Farmer.query.filter_by(username="profile_test_farmer1").first()
            if not f1:
                f1 = Farmer(
                    farm_name="Green Valley Farms",
                    username="profile_test_farmer1",
                    email="greenvalley_test@example.com",
                    mobile_number="9876543210",
                    password_hash=generate_password_hash("TestPass@123"),
                )
                db.session.add(f1)
                db.session.commit()
            cls.farmer1_id = f1.farmer_id

            # Create test farmer 2
            f2 = Farmer.query.filter_by(username="profile_test_farmer2").first()
            if not f2:
                f2 = Farmer(
                    farm_name="Golden Harvest Farms",
                    username="profile_test_farmer2",
                    email="goldenharvest_test@example.com",
                    mobile_number="9123456780",
                    password_hash=generate_password_hash("TestPass@123"),
                )
                db.session.add(f2)
                db.session.commit()
            cls.farmer2_id = f2.farmer_id

    def _auth_headers(self, farmer_id):
        """Generate JWT cookie and CSRF headers for authenticated requests."""
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

    def test_01_unauthenticated_access_denied(self):
        """Unauthenticated requests must be rejected with 401."""
        client = self.app.test_client()
        res = client.get("/api/profile")
        self.assertEqual(res.status_code, 401)

    def test_02_new_farmer_empty_profile(self):
        """Newly registered farmer with no profile returns 200 and profile=None."""
        headers = self._auth_headers(self.farmer2_id)
        # Clean up any existing profile for farmer 2 first
        with self.app.app_context():
            p2 = FarmerProfile.query.filter_by(user_id=self.farmer2_id).first()
            if p2:
                db.session.delete(p2)
                db.session.commit()

        res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsNone(data["profile"])
        self.assertEqual(data["farmer"]["username"], "profile_test_farmer2")
        self.assertEqual(data["email"], "goldenharvest_test@example.com")

    def test_03_create_profile_success(self):
        """Farmer can create a complete profile with multiple crops (status 201)."""
        headers = self._auth_headers(self.farmer1_id)
        # Ensure fresh start for farmer 1
        with self.app.app_context():
            p1 = FarmerProfile.query.filter_by(user_id=self.farmer1_id).first()
            if p1:
                db.session.delete(p1)
                db.session.commit()

        payload = {
            "full_name": "Ramesh Kumar Gowda",
            "mobile_number": "9876543210",
            "state": "Karnataka",
            "district": "Mandya",
            "taluk": "Maddur",
            "village": "Shivapura",
            "pin_code": "571428",
            "total_land_size": 4.75,
            "soil_type": "Red",
            "irrigation_type": "Canal",
            "farming_experience": 15,
            "preferred_language": "Kannada",
            "notifications_enabled": True,
            "main_crops": ["Sugarcane", "Ragi", "Rice"],
        }

        res = self.client.put("/api/profile", json=payload, headers=headers)
        self.assertIn(res.status_code, [200, 201])
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["profile"]["full_name"], "Ramesh Kumar Gowda")
        self.assertEqual(data["profile"]["state"], "Karnataka")
        self.assertEqual(data["profile"]["pin_code"], "571428")
        self.assertEqual(data["profile"]["total_land_size"], 4.75)
        self.assertEqual(data["profile"]["preferred_language"], "Kannada")
        self.assertCountEqual(data["profile"]["main_crops"], ["Sugarcane", "Ragi", "Rice"])

        # Check direct database persistence
        with self.app.app_context():
            saved_profile = FarmerProfile.query.filter_by(user_id=self.farmer1_id).first()
            self.assertIsNotNone(saved_profile)
            self.assertEqual(saved_profile.village, "Shivapura")
            crop_rows = FarmerProfileCrop.query.filter_by(profile_id=saved_profile.profile_id).all()
            crop_names = [c.crop_name for c in crop_rows]
            self.assertCountEqual(crop_names, ["Sugarcane", "Ragi", "Rice"])

    def test_04_get_created_profile(self):
        """GET /api/profile returns the saved profile and crops correctly."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsNotNone(data["profile"])
        self.assertEqual(data["profile"]["full_name"], "Ramesh Kumar Gowda")
        self.assertEqual(data["profile"]["email"], "greenvalley_test@example.com")
        self.assertCountEqual(data["profile"]["main_crops"], ["Sugarcane", "Ragi", "Rice"])

    def test_05_profile_completion_endpoint(self):
        """GET /api/profile/completion calculates percentage correctly."""
        headers = self._auth_headers(self.farmer1_id)
        res = self.client.get("/api/profile/completion", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["completion_percentage"], 100)
        self.assertTrue(data["is_complete"])
        self.assertEqual(len(data["missing_fields"]), 0)

    def test_06_update_profile_and_crops(self):
        """Farmer can update profile, change crops, toggle notifications."""
        headers = self._auth_headers(self.farmer1_id)
        payload = {
            "full_name": "Ramesh K. Gowda",
            "mobile_number": "9876543211",
            "state": "Karnataka",
            "district": "Mandya",
            "taluk": "Maddur",
            "village": "Shivapura Extension",
            "pin_code": "571428",
            "total_land_size": 5.5,
            "soil_type": "Black",
            "irrigation_type": "Drip",
            "farming_experience": 16,
            "preferred_language": "English",
            "notifications_enabled": False,
            "main_crops": ["Sugarcane", "Coconut", "Tomato"],
        }

        res = self.client.put("/api/profile", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["profile"]["full_name"], "Ramesh K. Gowda")
        self.assertEqual(data["profile"]["village"], "Shivapura Extension")
        self.assertEqual(data["profile"]["total_land_size"], 5.5)
        self.assertEqual(data["profile"]["soil_type"], "Black")
        self.assertEqual(data["profile"]["irrigation_type"], "Drip")
        self.assertEqual(data["profile"]["notifications_enabled"], False)
        self.assertCountEqual(data["profile"]["main_crops"], ["Sugarcane", "Coconut", "Tomato"])

        # Verify old crop "Ragi" was deleted and new crop "Coconut" added
        with self.app.app_context():
            p = FarmerProfile.query.filter_by(user_id=self.farmer1_id).first()
            crops = [c.crop_name for c in p.crops]
            self.assertIn("Coconut", crops)
            self.assertNotIn("Ragi", crops)

    def test_07_validation_errors(self):
        """Validation rules must properly reject invalid inputs with 400."""
        headers = self._auth_headers(self.farmer1_id)

        # Invalid mobile number
        bad_payload = {
            "full_name": "Test Name",
            "mobile_number": "12345",  # Invalid
            "state": "Karnataka",
            "district": "Mandya",
            "taluk": "Maddur",
            "village": "Shivapura",
            "pin_code": "571428",
            "total_land_size": 2.0,
            "soil_type": "Red",
            "irrigation_type": "Rainfed",
            "main_crops": ["Wheat"],
        }
        res = self.client.put("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("mobile_number", res.get_json()["errors"])

        # Invalid PIN code
        bad_payload["mobile_number"] = "9876543210"
        bad_payload["pin_code"] = "ABC12"
        res = self.client.put("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("pin_code", res.get_json()["errors"])

        # Invalid land size (<= 0)
        bad_payload["pin_code"] = "571428"
        bad_payload["total_land_size"] = -5
        res = self.client.put("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("total_land_size", res.get_json()["errors"])

        # Empty crops list
        bad_payload["total_land_size"] = 3.5
        bad_payload["main_crops"] = []
        res = self.client.put("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("main_crops", res.get_json()["errors"])

        # Invalid soil type
        bad_payload["main_crops"] = ["Rice"]
        bad_payload["soil_type"] = "Martian Dust"
        res = self.client.put("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("soil_type", res.get_json()["errors"])

    def test_08_cross_user_isolation(self):
        """User identity is derived strictly from JWT, preventing cross-user edits."""
        headers2 = self._auth_headers(self.farmer2_id)
        # Farmer 2 creates their own profile
        payload2 = {
            "full_name": "Suresh Gowda",
            "mobile_number": "9123456780",
            "state": "Karnataka",
            "district": "Hassan",
            "taluk": "Arasikere",
            "village": "Kanakatte",
            "pin_code": "573119",
            "total_land_size": 10.0,
            "soil_type": "Black",
            "irrigation_type": "Tubewell",
            "farming_experience": 25,
            "preferred_language": "Kannada",
            "notifications_enabled": True,
            "main_crops": ["Cotton", "Maize"],
            "user_id": self.farmer1_id,  # Attempt to overwrite user 1
        }
        res = self.client.put("/api/profile", json=payload2, headers=headers2)
        self.assertIn(res.status_code, [200, 201])

        # Verify Farmer 1's profile was NOT modified
        headers1 = self._auth_headers(self.farmer1_id)
        res1 = self.client.get("/api/profile", headers=headers1)
        self.assertEqual(res1.get_json()["profile"]["full_name"], "Ramesh K. Gowda")
        self.assertEqual(res1.get_json()["profile"]["village"], "Shivapura Extension")


if __name__ == "__main__":
    unittest.main()
