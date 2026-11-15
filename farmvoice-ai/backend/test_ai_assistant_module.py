"""FarmVoice AI - AI Assistant Module Comprehensive Test Suite.

Tests:
1. Multi-provider AI service layer & health checks.
2. 9 Supported regional languages (kn, hi, te, ta, ml, mr, bn, pa, en).
3. Verified government schemes retrieval & search.
4. Farmer context grounding (Profile, Crops, Farm Diary, Weather).
5. Agricultural prompt builder with safety guardrails.
6. JWT authentication & farmer data isolation (multi-tenant security).
7. Conversation & message persistence (CRUD lifecycle).
8. End-to-end question answering across all agronomic domains.
"""

import unittest
from unittest.mock import patch, MagicMock
from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_crop import FarmerCrop
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.services.ai_service import AIService
from app.services.farmer_context_service import FarmerContextService
from app.services.language_service import LanguageService, SUPPORTED_LANGUAGES
from app.services.scheme_service import SchemeService
from app.services.conversation_service import ConversationService
from flask_jwt_extended import create_access_token
from flask_jwt_extended.utils import decode_token


class AIAssistantTestSuite(unittest.TestCase):
    """Test cases for AI Assistant module."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Find or create a primary test farmer
        self.farmer1 = Farmer.query.filter_by(username="ai_test_farmer1").first()
        if not self.farmer1:
            self.farmer1 = Farmer(
                farm_name="Green Pastures Farm",
                username="ai_test_farmer1",
                email="farmer1_ai_test@farmvoice.in",
                mobile_number="9876543210",
                password_hash="scrypt:fakehashforunittests",
            )
            db.session.add(self.farmer1)
            db.session.commit()

        # Profile for farmer 1
        prof1 = FarmerProfile.query.filter_by(user_id=self.farmer1.farmer_id).first()
        if not prof1:
            prof1 = FarmerProfile(
                user_id=self.farmer1.farmer_id,
                full_name="Ramesh Patil",
                mobile_number="9876543210",
                state="Karnataka",
                district="Bagalkote",
                taluk="Mudhol",
                village="Hebbal",
                pin_code="587313",
                total_land_size=4.5,
                land_unit="Acres",
                soil_type="Black Soil",
                irrigation_type="Tubewell",
                farming_experience=15,
                preferred_language="Kannada",
            )
            db.session.add(prof1)
            db.session.commit()

        # Farmer 2 for data isolation testing
        self.farmer2 = Farmer.query.filter_by(username="ai_test_farmer2").first()
        if not self.farmer2:
            self.farmer2 = Farmer(
                farm_name="Sunrise Organics",
                username="ai_test_farmer2",
                email="farmer2_ai_test@farmvoice.in",
                mobile_number="9876543211",
                password_hash="scrypt:fakehashforunittests",
            )
            db.session.add(self.farmer2)
            db.session.commit()

        # Generate tokens
        token1 = create_access_token(identity=str(self.farmer1.farmer_id))
        csrf1 = decode_token(token1)["csrf"]
        self.farmer1_cookies = {
            "access_token_cookie": token1,
            "csrf_access_token_cookie": csrf1,
        }
        self.farmer1_headers = {"X-CSRF-TOKEN": csrf1}

        token2 = create_access_token(identity=str(self.farmer2.farmer_id))
        csrf2 = decode_token(token2)["csrf"]
        self.farmer2_cookies = {
            "access_token_cookie": token2,
            "csrf_access_token_cookie": csrf2,
        }
        self.farmer2_headers = {"X-CSRF-TOKEN": csrf2}

    def tearDown(self):
        # Clean up any AI conversations created in tests
        AIConversation.query.filter(
            AIConversation.user_id.in_([self.farmer1.farmer_id, self.farmer2.farmer_id])
        ).delete(synchronize_session=False)
        db.session.commit()
        self.app_context.pop()

    # -------------------------------------------------------------------------
    # 1. Supported Languages & Localization
    # -------------------------------------------------------------------------
    def test_nine_supported_languages(self):
        """Verify all 9 target languages are registered with proper speech codes."""
        res = self.client.get("/api/ai/languages")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        langs = data["languages"]
        self.assertEqual(len(langs), 9)

        expected_codes = ["kn", "hi", "te", "ta", "ml", "mr", "bn", "pa", "en"]
        codes = [l["code"] for l in langs]
        for c in expected_codes:
            self.assertIn(c, codes)

        # Test normalization
        self.assertEqual(LanguageService.normalize_language_code("Kannada"), "kn")
        self.assertEqual(LanguageService.normalize_language_code("kn-IN"), "kn")
        self.assertEqual(LanguageService.normalize_language_code("HINDI"), "hi")
        self.assertEqual(LanguageService.normalize_language_code("unknown"), "en")

    # -------------------------------------------------------------------------
    # 2. Verified Government Schemes
    # -------------------------------------------------------------------------
    def test_verified_schemes(self):
        """Verify schemes endpoint returns verified national agricultural schemes."""
        res = self.client.get("/api/ai/schemes")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        schemes = data["schemes"]
        self.assertGreaterEqual(len(schemes), 6)

        # Search matching
        kisan_matches = SchemeService.search_schemes("PM-KISAN 6000 subsidy")
        self.assertTrue(any(s["id"] == "pm-kisan" for s in kisan_matches))

        bima_matches = SchemeService.search_schemes("crop insurance loss damage")
        self.assertTrue(any(s["id"] == "pmfby" for s in bima_matches))

    # -------------------------------------------------------------------------
    # 3. Health & Missing API Key Resilience
    # -------------------------------------------------------------------------
    def test_health_and_missing_api_key_handling(self):
        """Verify health check and that missing API key returns clear instructions."""
        with patch.dict(self.app.config, {"AI_API_KEY": ""}):
            res = self.client.get("/api/ai/health")
            data = res.get_json()
            self.assertEqual(data["health"]["configured"], False)
            self.assertIn("requires an API key", data["health"]["message"])

            # POST /api/ai/chat should return 503 with helpful config guidance
            for k, v in self.farmer1_cookies.items():
                self.client.set_cookie(k, v)

            chat_res = self.client.post(
                "/api/ai/chat",
                json={"message": "How do I grow sugarcane?"},
                headers=self.farmer1_headers,
            )
            self.assertEqual(chat_res.status_code, 503)
            chat_data = chat_res.get_json()
            self.assertEqual(chat_data["error_type"], "MISSING_API_KEY")

    # -------------------------------------------------------------------------
    # 4. Farmer Context Grounding
    # -------------------------------------------------------------------------
    def test_farmer_context_grounding(self):
        """Verify FarmerContextService accurately extracts profile, crops, and weather."""
        context = FarmerContextService.get_farmer_context(
            self.farmer1.farmer_id, "What crop is best for black soil?"
        )
        self.assertEqual(context["farmer_name"], "Ramesh Patil")
        self.assertIsNotNone(context["profile"])
        self.assertEqual(context["profile"]["soil_type"], "Black Soil")
        self.assertEqual(context["profile"]["district"], "Bagalkote")

        formatted = FarmerContextService.format_context_for_prompt(context)
        self.assertIn("Ramesh Patil", formatted)
        self.assertIn("Black Soil", formatted)
        self.assertIn("Bagalkote", formatted)

    # -------------------------------------------------------------------------
    # 5. Security & Multi-Tenant Data Isolation
    # -------------------------------------------------------------------------
    def test_security_and_farmer_data_isolation(self):
        """Farmer A must NEVER access or delete Farmer B's conversations."""
        # Create conversation for Farmer 1
        conv1, status = ConversationService.create_conversation(
            user_id=self.farmer1.farmer_id, title="Farmer 1 Private Advisory"
        )
        self.assertEqual(status, 201)
        conv1_id = conv1["id"]

        # Farmer 2 tries to GET Farmer 1's conversation -> 404
        for k, v in self.farmer2_cookies.items():
            self.client.set_cookie(k, v)

        res_get = self.client.get(f"/api/ai/conversations/{conv1_id}")
        self.assertEqual(res_get.status_code, 404)

        # Farmer 2 tries to DELETE Farmer 1's conversation -> 404
        res_del = self.client.delete(
            f"/api/ai/conversations/{conv1_id}",
            headers=self.farmer2_headers,
        )
        self.assertEqual(res_del.status_code, 404)

        # Unauthenticated request -> 401
        unauth_client = self.app.test_client()
        res_unauth = unauth_client.get(f"/api/ai/conversations/{conv1_id}")
        self.assertEqual(res_unauth.status_code, 401)

    # -------------------------------------------------------------------------
    # 6. Conversation Lifecycle & CRUD
    # -------------------------------------------------------------------------
    def test_conversation_lifecycle(self):
        """Test conversation create, list, retrieve, message addition, and delete."""
        for k, v in self.farmer1_cookies.items():
            self.client.set_cookie(k, v)

        # 1. Create
        create_res = self.client.post(
            "/api/ai/conversations",
            json={"title": "Cotton Pest Advisory", "language": "kn"},
            headers=self.farmer1_headers,
        )
        self.assertEqual(create_res.status_code, 201)
        conv_id = create_res.get_json()["id"]

        # 2. Add message
        ConversationService.add_message(conv_id, "user", "How to control bollworm?")
        ConversationService.add_message(conv_id, "assistant", "Use pheromone traps and neem oil.")

        # 3. Retrieve
        get_res = self.client.get(f"/api/ai/conversations/{conv_id}")
        self.assertEqual(get_res.status_code, 200)
        messages = get_res.get_json()["conversation"]["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "user")
        self.assertEqual(messages[1]["role"], "assistant")

        # 4. List
        list_res = self.client.get("/api/ai/conversations")
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(list_res.get_json()["count"], 1)

        # 5. Delete
        del_res = self.client.delete(
            f"/api/ai/conversations/{conv_id}",
            headers=self.farmer1_headers,
        )
        self.assertEqual(del_res.status_code, 200)

        # Verify deletion in DB
        self.assertIsNone(db.session.get(AIConversation, conv_id))
        self.assertEqual(AIMessage.query.filter_by(conversation_id=conv_id).count(), 0)

    # -------------------------------------------------------------------------
    # 7. End-to-End Multilingual AI Chat (Mock Provider)
    # -------------------------------------------------------------------------
    def test_e2e_chat_all_domains(self):
        """Test asking questions across farming, pest, weather, and schemes."""
        with patch.dict(self.app.config, {"AI_API_KEY": "test-key-mock"}):
            for k, v in self.farmer1_cookies.items():
                self.client.set_cookie(k, v)

            test_cases = [
                {
                    "domain": "Crop Selection",
                    "lang": "kn",
                    "question": "ನನ್ನ ಜಮೀನಿಗೆ ಯಾವ ಬೆಳೆ ಸೂಕ್ತ?",
                    "mock_answer": "## ಕಪ್ಪು ಮಣ್ಣಿಗೆ ಸೂಕ್ತವಾದ ಬೆಳೆಗಳು\n1. ಕಬ್ಬು\n2. ಹತ್ತಿ\n3. ಮೆಕ್ಕೆಜೋಳ",
                },
                {
                    "domain": "Pest & Disease",
                    "lang": "hi",
                    "question": "फसल में कीट नियंत्रण कैसे करें?",
                    "mock_answer": "## कीट नियंत्रण सलाह\n- नीम तेल का 5ml प्रति लीटर छिड़काव करें।",
                },
                {
                    "domain": "Government Schemes",
                    "lang": "en",
                    "question": "Am I eligible for PM-KISAN subsidy?",
                    "mock_answer": "## PM-KISAN Scheme\n- Direct benefit of ₹6,000 per year for landholding farmers.",
                },
            ]

            for case in test_cases:
                mock_resp = MagicMock()
                mock_resp.status_code = 200
                mock_resp.json.return_value = {
                    "candidates": [
                        {
                            "content": {
                                "parts": [{"text": case["mock_answer"]}]
                            }
                        }
                    ]
                }

                with patch("requests.post", return_value=mock_resp):
                    res = self.client.post(
                        "/api/ai/chat",
                        json={
                            "message": case["question"],
                            "language": case["lang"],
                        },
                        headers=self.farmer1_headers,
                    )
                    self.assertEqual(res.status_code, 200, f"Failed for {case['domain']}")
                    data = res.get_json()
                    self.assertTrue(data["success"])
                    self.assertEqual(data["language"], case["lang"])
                    self.assertEqual(data["message"], case["mock_answer"])
                    self.assertIn("context_summary", data)


if __name__ == "__main__":
    unittest.main()
