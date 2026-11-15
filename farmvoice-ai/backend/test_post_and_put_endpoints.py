"""Unit tests for POST /api/profile and PUT /api/profile separation and duplicate prevention."""

import unittest
from flask_jwt_extended import create_access_token, get_csrf_token
from werkzeug.security import generate_password_hash
import time

from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop


class PostAndPutEndpointsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            suffix = str(int(time.time() * 1000))[-6:]
            farmer = Farmer(
                farm_name=f"Duplicate Test Farm {suffix}",
                username=f"dup_test_{suffix}",
                email=f"dup_test_{suffix}@example.com",
                mobile_number="9876543210",
                password_hash=generate_password_hash("TestPass@123"),
            )
            db.session.add(farmer)
            db.session.commit()
            cls.farmer_id = farmer.farmer_id

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

    def test_post_create_then_duplicate_rejected_then_put_updates(self):
        headers = self._auth_headers(self.farmer_id)

        # 1. GET profile initially -> None
        res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.get_json()["profile"])

        payload = {
            "full_name": "Test Farmer POST",
            "mobile_number": "9876543210",
            "state": "Karnataka",
            "district": "Belagavi",
            "taluk": "Chikkodi",
            "village": "Ankali",
            "pin_code": "591213",
            "total_land_size": 3.5,
            "land_unit": "Hectares",
            "soil_type": "Black Soil",
            "irrigation_type": "Drip Irrigation",
            "farming_experience": 8,
            "preferred_language": "Kannada",
            "notifications_enabled": True,
            "main_crops": ["Sugarcane", "Tomato"],
        }

        # 2. POST /api/profile -> 201 Created
        res_post = self.client.post("/api/profile", json=payload, headers=headers)
        self.assertEqual(res_post.status_code, 201)
        data = res_post.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["profile"]["land_unit"], "Hectares")
        self.assertEqual(data["profile"]["soil_type"], "Black Soil")

        # 3. Second POST /api/profile -> 409 Conflict (Duplicate prevention)
        res_dup = self.client.post("/api/profile", json=payload, headers=headers)
        self.assertEqual(res_dup.status_code, 409)
        self.assertFalse(res_dup.get_json()["success"])
        self.assertIn("already exists", res_dup.get_json()["message"])

        # 4. PUT /api/profile -> 200 OK (Update existing)
        update_payload = dict(payload)
        update_payload["full_name"] = "Test Farmer PUT Updated"
        update_payload["total_land_size"] = 4.2
        update_payload["land_unit"] = "Acres"
        update_payload["main_crops"] = ["Sugarcane", "Tomato", "Chilli"]

        res_put = self.client.put("/api/profile", json=update_payload, headers=headers)
        self.assertEqual(res_put.status_code, 200)
        put_data = res_put.get_json()
        self.assertTrue(put_data["success"])
        self.assertEqual(put_data["profile"]["full_name"], "Test Farmer PUT Updated")
        self.assertEqual(put_data["profile"]["total_land_size"], 4.2)
        self.assertEqual(put_data["profile"]["land_unit"], "Acres")
        self.assertCountEqual(put_data["profile"]["main_crops"], ["Sugarcane", "Tomato", "Chilli"])

        # 5. Verify only 1 profile row exists in DB for this user
        with self.app.app_context():
            profiles = FarmerProfile.query.filter_by(user_id=self.farmer_id).all()
            self.assertEqual(len(profiles), 1)


if __name__ == "__main__":
    unittest.main()
