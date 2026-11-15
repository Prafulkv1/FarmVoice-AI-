"""FarmVoice AI - Comprehensive Farmer Profile Module Verification Test Suite.

Covers all 6 test scenarios defined in Section 13:
  Test 1: New Farmer Registration, Initial Empty State & First Save (POST /api/profile -> 201)
  Test 2: Existing Farmer Fetch, Persistence & Real-time Completion Calculation
  Test 3: Profile Update (PUT /api/profile -> 200), Crop Reconciliation & Record Deduplication
  Test 4: Duplicate Creation Rejection (POST /api/profile on existing -> 409 Conflict)
  Test 5: Authentication Protection (401) & Cross-Farmer Data Isolation
  Test 6: Input Validation Errors (400) & Safe Rollback Handling
"""

import time
import unittest
from flask_jwt_extended import create_access_token, get_csrf_token
from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop


class ComprehensiveProfileModuleTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

    def _auth_headers_for(self, farmer_id):
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

    def test_01_new_farmer_workflow(self):
        """Test 1: New Farmer: Register, Login, Empty Profile Fetch, and First Profile Creation (POST)."""
        suffix = str(int(time.time() * 1000))[-6:]
        username = f"farmer_new_{suffix}"
        email = f"farmer_new_{suffix}@farmvoice.test"
        mobile = f"98{suffix.zfill(8)}"
        farm_name = f"Sunrise Organic Farm {suffix}"
        password = "SecurePassword@2026"

        # 1. Register new farmer
        reg_res = self.client.post("/api/auth/register", json={
            "farm_name": farm_name,
            "username": username,
            "email": email,
            "mobile_number": mobile,
            "password": password,
            "confirm_password": password,
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.get_json()
        farmer_id = reg_data.get("farmer_id") or reg_data.get("farmer", {}).get("farmer_id")

        # 2. Log in
        login_res = self.client.post("/api/auth/login", json={
            "username": username,
            "password": password,
        })
        self.assertEqual(login_res.status_code, 200)

        # Extract CSRF token
        csrf_token = None
        for cookie in login_res.headers.getlist("Set-Cookie"):
            if "csrf_access_token_cookie=" in cookie:
                csrf_token = cookie.split("csrf_access_token_cookie=")[1].split(";")[0]
                break
        self.assertIsNotNone(csrf_token)
        headers = {"X-CSRF-TOKEN": csrf_token, "Content-Type": "application/json"}

        # 3. Open Profile: Verify ONLY registration credentials appear, profile=None, completion=20%
        prof_res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(prof_res.status_code, 200)
        prof_data = prof_res.get_json()
        self.assertTrue(prof_data["success"])
        self.assertIsNone(prof_data["profile"])
        self.assertEqual(prof_data["farmer"]["farmer_id"], farmer_id)
        self.assertEqual(prof_data["farmer"]["full_name"], farm_name)
        self.assertEqual(prof_data["farmer"]["email"], email)
        self.assertEqual(prof_data["farmer"]["mobile_number"], mobile)
        self.assertEqual(prof_data["completion_percentage"], 20)

        # 4. Save Profile via POST /api/profile
        profile_payload = {
            "full_name": "Siddaraju B. Gowda",
            "mobile_number": mobile,
            "state": "Karnataka",
            "district": "Mandya",
            "taluk": "Pandavapura",
            "village": "Melukote",
            "pin_code": "571431",
            "total_land_size": 6.5,
            "land_unit": "Acres",
            "soil_type": "Red Soil",
            "irrigation_type": "Canal",
            "farming_experience": 14,
            "preferred_language": "Kannada",
            "notifications_enabled": True,
            "main_crops": ["Sugarcane", "Ragi", "Rice"],
        }
        create_res = self.client.post("/api/profile", json=profile_payload, headers=headers)
        self.assertEqual(create_res.status_code, 201)
        create_data = create_res.get_json()
        self.assertTrue(create_data["success"])
        self.assertEqual(create_data["profile"]["village"], "Melukote")
        self.assertEqual(create_data["profile"]["land_unit"], "Acres")
        self.assertEqual(create_data["completion_percentage"], 100)

        # 5. Direct MySQL Database Verification
        with self.app.app_context():
            p_db = FarmerProfile.query.filter_by(user_id=farmer_id).first()
            self.assertIsNotNone(p_db)
            self.assertEqual(p_db.full_name, "Siddaraju B. Gowda")
            self.assertEqual(p_db.land_unit, "Acres")
            self.assertEqual(float(p_db.total_land_size), 6.5)
            self.assertEqual(p_db.soil_type, "Red Soil")
            crops = [c.crop_name for c in p_db.crops]
            self.assertCountEqual(crops, ["Sugarcane", "Ragi", "Rice"])

    def test_02_existing_farmer_fetch_and_completion(self):
        """Test 2: Existing Farmer: Fetch persisted data and verify completion calculation."""
        suffix = str(int(time.time() * 1000))[-6:]
        username = f"farmer_exist_{suffix}"
        email = f"farmer_exist_{suffix}@farmvoice.test"
        mobile = f"97{suffix.zfill(8)}"

        with self.app.app_context():
            farmer = Farmer(
                farm_name="Bhoomi Agro",
                username=username,
                email=email,
                mobile_number=mobile,
                password_hash=generate_password_hash("Pass@123"),
            )
            db.session.add(farmer)
            db.session.commit()
            farmer_id = farmer.farmer_id

            profile = FarmerProfile(
                user_id=farmer_id,
                full_name="Basavaraj Patil",
                mobile_number=mobile,
                state="Karnataka",
                district="Dharwad",
                taluk="Hubballi",
                village="Navalgund",
                pin_code="580029",
                total_land_size=12.0,
                land_unit="Acres",
                soil_type="Black Soil",
                irrigation_type="Tubewell",
                farming_experience=20,
                preferred_language="Kannada",
                notifications_enabled=True,
            )
            db.session.add(profile)
            db.session.flush()

            for crop_name in ["Cotton", "Chilli", "Groundnut"]:
                db.session.add(FarmerProfileCrop(profile_id=profile.profile_id, crop_name=crop_name))
            db.session.commit()

        headers = self._auth_headers_for(farmer_id)
        res = self.client.get("/api/profile", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsNotNone(data["profile"])
        self.assertEqual(data["profile"]["village"], "Navalgund")
        self.assertEqual(data["profile"]["land_unit"], "Acres")
        self.assertEqual(data["profile"]["soil_type"], "Black Soil")
        self.assertCountEqual(data["profile"]["main_crops"], ["Cotton", "Chilli", "Groundnut"])
        self.assertEqual(data["completion_percentage"], 100)

        # Test completion endpoint
        comp_res = self.client.get("/api/profile/completion", headers=headers)
        self.assertEqual(comp_res.status_code, 200)
        comp_data = comp_res.get_json()
        self.assertTrue(comp_data["is_complete"])
        self.assertEqual(comp_data["completion_percentage"], 100)
        self.assertEqual(comp_data["completed_count"], 15)

    def test_03_update_profile_and_deduplication(self):
        """Test 3: Update Profile (PUT /api/profile): updates same record, no duplicates."""
        suffix = str(int(time.time() * 1000))[-6:]
        username = f"farmer_upd_{suffix}"
        email = f"farmer_upd_{suffix}@farmvoice.test"
        mobile = f"96{suffix.zfill(8)}"

        with self.app.app_context():
            farmer = Farmer(
                farm_name="Original Farm",
                username=username,
                email=email,
                mobile_number=mobile,
                password_hash=generate_password_hash("Pass@123"),
            )
            db.session.add(farmer)
            db.session.commit()
            farmer_id = farmer.farmer_id

            profile = FarmerProfile(
                user_id=farmer_id,
                full_name="Original Name",
                mobile_number=mobile,
                state="Karnataka",
                district="Belagavi",
                taluk="Gokak",
                village="Gokak Falls",
                pin_code="591307",
                total_land_size=5.0,
                land_unit="Acres",
                soil_type="Red Soil",
                irrigation_type="Rainfed",
                farming_experience=5,
                preferred_language="English",
                notifications_enabled=True,
            )
            db.session.add(profile)
            db.session.flush()
            db.session.add(FarmerProfileCrop(profile_id=profile.profile_id, crop_name="Maize"))
            db.session.commit()
            orig_profile_id = profile.profile_id

        headers = self._auth_headers_for(farmer_id)
        update_payload = {
            "full_name": "Updated Farmer Name",
            "mobile_number": "9612345678",
            "state": "Karnataka",
            "district": "Belagavi",
            "taluk": "Gokak",
            "village": "Gokak Town",
            "pin_code": "591307",
            "total_land_size": 8.75,
            "land_unit": "Hectares",
            "soil_type": "Black Soil",
            "irrigation_type": "Drip Irrigation",
            "farming_experience": 7,
            "preferred_language": "Kannada",
            "notifications_enabled": False,
            "main_crops": ["Sugarcane", "Tomato"],  # "Maize" removed, "Sugarcane" and "Tomato" added
        }

        put_res = self.client.put("/api/profile", json=update_payload, headers=headers)
        self.assertEqual(put_res.status_code, 200)
        put_data = put_res.get_json()
        self.assertTrue(put_data["success"])
        self.assertEqual(put_data["profile"]["id"], orig_profile_id)
        self.assertEqual(put_data["profile"]["total_land_size"], 8.75)
        self.assertEqual(put_data["profile"]["land_unit"], "Hectares")
        self.assertEqual(put_data["profile"]["notifications_enabled"], False)
        self.assertCountEqual(put_data["profile"]["main_crops"], ["Sugarcane", "Tomato"])

        # Verify in MySQL: same profile_id, no duplicate rows created
        with self.app.app_context():
            rows = FarmerProfile.query.filter_by(user_id=farmer_id).all()
            self.assertEqual(len(rows), 1, "Must NOT create duplicate profile rows")
            self.assertEqual(rows[0].profile_id, orig_profile_id)
            self.assertEqual(rows[0].full_name, "Updated Farmer Name")
            self.assertEqual(rows[0].village, "Gokak Town")
            self.assertEqual(rows[0].land_unit, "Hectares")
            # Verify user model synced
            farmer_row = db.session.get(Farmer, farmer_id)
            self.assertEqual(farmer_row.farm_name, "Updated Farmer Name")
            self.assertEqual(farmer_row.mobile_number, "9612345678")
            # Verify crop rows: Maize removed, Sugarcane and Tomato present
            crops_in_db = [c.crop_name for c in rows[0].crops]
            self.assertCountEqual(crops_in_db, ["Sugarcane", "Tomato"])

    def test_04_duplicate_creation_rejected(self):
        """Test 4: POST /api/profile rejects duplicate creation with 409 Conflict."""
        suffix = str(int(time.time() * 1000))[-6:]
        username = f"farmer_dup_{suffix}"
        email = f"farmer_dup_{suffix}@farmvoice.test"
        mobile = f"95{suffix.zfill(8)}"

        with self.app.app_context():
            farmer = Farmer(
                farm_name="Duplicate Guard Farm",
                username=username,
                email=email,
                mobile_number=mobile,
                password_hash=generate_password_hash("Pass@123"),
            )
            db.session.add(farmer)
            db.session.commit()
            farmer_id = farmer.farmer_id

            profile = FarmerProfile(
                user_id=farmer_id,
                full_name="Duplicate Guard",
                mobile_number=mobile,
                state="Karnataka",
                district="Hassan",
                taluk="Hassan",
                village="Alur",
                pin_code="573201",
                total_land_size=2.0,
                land_unit="Acres",
                soil_type="Red Soil",
                irrigation_type="Rainfed",
                farming_experience=3,
                preferred_language="Kannada",
                notifications_enabled=True,
            )
            db.session.add(profile)
            db.session.commit()

        headers = self._auth_headers_for(farmer_id)
        payload = {
            "full_name": "Attempt Second Profile",
            "mobile_number": mobile,
            "state": "Karnataka",
            "district": "Hassan",
            "taluk": "Hassan",
            "village": "Alur",
            "pin_code": "573201",
            "total_land_size": 2.0,
            "land_unit": "Acres",
            "soil_type": "Red Soil",
            "irrigation_type": "Rainfed",
            "farming_experience": 3,
            "preferred_language": "Kannada",
            "notifications_enabled": True,
            "main_crops": ["Coffee"],
        }
        post_res = self.client.post("/api/profile", json=payload, headers=headers)
        self.assertEqual(post_res.status_code, 409)
        self.assertFalse(post_res.get_json()["success"])
        self.assertIn("already exists", post_res.get_json()["message"])

    def test_05_unauthorized_and_isolation(self):
        """Test 5: Unauthenticated access rejected with 401; user identity isolated strictly to JWT."""
        # Unauthenticated calls
        anon = self.app.test_client()
        self.assertEqual(anon.get("/api/profile").status_code, 401)
        self.assertEqual(anon.post("/api/profile", json={}).status_code, 401)
        self.assertEqual(anon.put("/api/profile", json={}).status_code, 401)
        self.assertEqual(anon.get("/api/profile/completion").status_code, 401)

        # Cross-user isolation: User B cannot modify User A's profile even by passing User A's user_id in payload
        suffix = str(int(time.time() * 1000))[-6:]
        with self.app.app_context():
            fa = Farmer(
                farm_name="Farmer A Farm",
                username=f"farmer_a_{suffix}",
                email=f"farmer_a_{suffix}@test.com",
                mobile_number=f"94{suffix.zfill(8)}",
                password_hash=generate_password_hash("Pass@123"),
            )
            fb = Farmer(
                farm_name="Farmer B Farm",
                username=f"farmer_b_{suffix}",
                email=f"farmer_b_{suffix}@test.com",
                mobile_number=f"93{suffix.zfill(8)}",
                password_hash=generate_password_hash("Pass@123"),
            )
            db.session.add_all([fa, fb])
            db.session.commit()
            fa_id = fa.farmer_id
            fb_id = fb.farmer_id

            pa = FarmerProfile(
                user_id=fa_id,
                full_name="Farmer A Real",
                mobile_number=f"94{suffix.zfill(8)}",
                state="Karnataka",
                district="Mandya",
                taluk="Maddur",
                village="Kikkeri",
                pin_code="571428",
                total_land_size=3.0,
                land_unit="Acres",
                soil_type="Red Soil",
                irrigation_type="Canal",
                farming_experience=10,
                preferred_language="Kannada",
                notifications_enabled=True,
            )
            db.session.add(pa)
            db.session.commit()

        # Farmer B tries to update Farmer A's profile by spoofing user_id
        headers_b = self._auth_headers_for(fb_id)
        spoof_payload = {
            "user_id": fa_id,
            "profile_id": 999999,
            "full_name": "Spoofed by Farmer B",
            "mobile_number": f"93{suffix.zfill(8)}",
            "state": "Karnataka",
            "district": "Hassan",
            "taluk": "Belur",
            "village": "Halebeedu",
            "pin_code": "573115",
            "total_land_size": 1.0,
            "land_unit": "Acres",
            "soil_type": "Black Soil",
            "irrigation_type": "Rainfed",
            "farming_experience": 2,
            "preferred_language": "English",
            "notifications_enabled": True,
            "main_crops": ["Coffee"],
        }
        res = self.client.put("/api/profile", json=spoof_payload, headers=headers_b)
        self.assertIn(res.status_code, [200, 201])

        # Verify Farmer A was completely unaffected
        headers_a = self._auth_headers_for(fa_id)
        res_a = self.client.get("/api/profile", headers=headers_a)
        self.assertEqual(res_a.get_json()["profile"]["full_name"], "Farmer A Real")
        self.assertEqual(res_a.get_json()["profile"]["village"], "Kikkeri")

    def test_06_validation_and_failure_handling(self):
        """Test 6: Strict validation rules reject invalid input without persisting corrupt data."""
        suffix = str(int(time.time() * 1000))[-6:]
        with self.app.app_context():
            farmer = Farmer(
                farm_name="Validation Guard Farm",
                username=f"farmer_val_{suffix}",
                email=f"farmer_val_{suffix}@test.com",
                mobile_number=f"92{suffix.zfill(8)}",
                password_hash=generate_password_hash("Pass@123"),
            )
            db.session.add(farmer)
            db.session.commit()
            farmer_id = farmer.farmer_id

        headers = self._auth_headers_for(farmer_id)

        # 1. Invalid PIN code (5 digits instead of 6)
        bad_payload = {
            "full_name": "Test Farmer",
            "mobile_number": "9876543210",
            "state": "Karnataka",
            "district": "Kolar",
            "taluk": "Bangarapet",
            "village": "Kotilingeshwara",
            "pin_code": "12345",  # Invalid
            "total_land_size": 4.0,
            "land_unit": "Acres",
            "soil_type": "Red Soil",
            "irrigation_type": "Canal",
            "farming_experience": 5,
            "preferred_language": "Kannada",
            "notifications_enabled": True,
            "main_crops": ["Tomato"],
        }
        res1 = self.client.post("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res1.status_code, 400)
        self.assertIn("pin_code", res1.get_json()["errors"])

        # 2. Invalid Mobile Number
        bad_payload["pin_code"] = "563114"
        bad_payload["mobile_number"] = "1234567890"  # Invalid Indian mobile prefix
        res2 = self.client.post("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res2.status_code, 400)
        self.assertIn("mobile_number", res2.get_json()["errors"])

        # 3. Invalid Land Size (zero or negative)
        bad_payload["mobile_number"] = "9876543210"
        bad_payload["total_land_size"] = 0
        res3 = self.client.post("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res3.status_code, 400)
        self.assertIn("total_land_size", res3.get_json()["errors"])

        # 4. Invalid Soil Type
        bad_payload["total_land_size"] = 2.5
        bad_payload["soil_type"] = "Martian Regolith"
        res4 = self.client.post("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res4.status_code, 400)
        self.assertIn("soil_type", res4.get_json()["errors"])

        # 5. Empty crops list
        bad_payload["soil_type"] = "Red Soil"
        bad_payload["main_crops"] = []
        res5 = self.client.post("/api/profile", json=bad_payload, headers=headers)
        self.assertEqual(res5.status_code, 400)
        self.assertIn("main_crops", res5.get_json()["errors"])

        # Verify no corrupt profile was stored in MySQL
        with self.app.app_context():
            p = FarmerProfile.query.filter_by(user_id=farmer_id).first()
            self.assertIsNone(p)


if __name__ == "__main__":
    unittest.main()
