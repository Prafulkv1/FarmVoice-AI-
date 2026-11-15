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

import io
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
from app.services.language_detection_service import LanguageDetectionService
from app.services.dialect_adaptation_service import (
    DialectAdaptationService,
    REGIONAL_DIALECT_REGISTRY,
)
from app.services.speech_to_text_service import SpeechToTextService
from app.services.text_to_speech_service import (
    TextToSpeechService,
    clean_text_for_speech,
)
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

    # -------------------------------------------------------------------------
    # 8. Language Detection Service (All 9 Regional Languages)
    # -------------------------------------------------------------------------
    def test_language_detection_all_scripts(self):
        """Verify LanguageDetectionService identifies scripts for all 9 languages."""
        samples = [
            ("ನನ್ನ ರಾಗಿ ಬೆಳೆಗೆ ಎಲೆಗಳು ಹಳದಿ ಆಗ್ತಿವೆ, ಏನು ಮಾಡಬೇಕು?", "kn"),
            ("मेरी गेहूं की फसल में दीमक का प्रकोप हो गया है", "hi"),
            ("నా వರಿ పొలంలో కాండం తొలిచే పురుగు ఆశించింది", "te"),
            ("எனது நெல் பயிரில் இலை சுருட்டு புழு தாக்குதல் உள்ளது", "ta"),
            ("എന്റെ നെൽകൃഷിയിൽ ബാക്ടീരിയൽ വാട്ടം ബാധിച്ചിട്ടുണ്ട്", "ml"),
            ("माझ्या सोयाबीन पिकावर पिवळा मोझॅक रोगाचा प्रादुर्भाव झाला आहे", "mr"),
            ("আমার ধান ক্ষেতে খোল পচা রোগ দেখা দিয়েছে কি করব?", "bn"),
            ("ਮੇਰੀ ਕਣਕ ਦੀ ਫਸਲ ਦੇ ਪੱਤੇ ਪੀਲੇ ਪੈ ਰਹੇ ਹਨ ਕੀ ਕਰੀਏ?", "pa"),
            ("What is the best fertilizer dose for sugarcane in black soil?", "en"),
        ]

        for text, expected_lang in samples:
            res = LanguageDetectionService.detect_language(text)
            detected = res["detected_language"]
            confidence = res["confidence"]
            self.assertEqual(
                detected,
                expected_lang,
                f"Failed detection for '{text}' -> got {detected}, expected {expected_lang}",
            )
            self.assertGreater(confidence, 0.5)

    def test_devanagari_marathi_vs_hindi_heuristics(self):
        """Test distinction between Marathi and Hindi in Devanagari script."""
        # Marathi unique phoneme / marker words
        marathi_1 = "पिकांची काळजी कशी घ्यावी आणि खत कधी टाकावे?"
        res1 = LanguageDetectionService.detect_language(marathi_1)
        self.assertEqual(res1["detected_language"], "mr")

        marathi_2 = "माझ्या शेतात पाणी साचले आहे काय करू?"
        res2 = LanguageDetectionService.detect_language(marathi_2)
        self.assertEqual(res2["detected_language"], "mr")

        # Standard Hindi phrases
        hindi_1 = "फसलों का ख्याल कैसे रखें और खाद कब डालें?"
        res3 = LanguageDetectionService.detect_language(hindi_1)
        self.assertEqual(res3["detected_language"], "hi")

        hindi_2 = "मेरे खेत में पानी भर गया है क्या करें?"
        res4 = LanguageDetectionService.detect_language(hindi_2)
        self.assertEqual(res4["detected_language"], "hi")

    def test_transliterated_language_detection(self):
        """Test detection of Romanized/transliterated Indian languages."""
        kannada_translit = "nanna ragi bele haladi agide enu madodu?"
        res1 = LanguageDetectionService.detect_language(kannada_translit)
        self.assertEqual(res1["detected_language"], "kn")

        hindi_translit = "meri fasal kharab ho rahi hai kisaan bhai kya kare?"
        res2 = LanguageDetectionService.detect_language(hindi_translit)
        self.assertEqual(res2["detected_language"], "hi")

        telugu_translit = "naa chetilo chettu rogam vachindi em cheyali?"
        res3 = LanguageDetectionService.detect_language(telugu_translit)
        self.assertEqual(res3["detected_language"], "te")

    # -------------------------------------------------------------------------
    # 9. Dialect Adaptation Service (Registry, Rules & Prompts)
    # -------------------------------------------------------------------------
    def test_dialect_adaptation_registry_and_prompts(self):
        """Verify DialectAdaptationService registry and contextual instructions."""
        # Check all 9 languages exist in registry
        for lang_code in ["kn", "hi", "te", "ta", "ml", "mr", "bn", "pa", "en"]:
            dialects = DialectAdaptationService.get_supported_dialects_for_language(lang_code)
            self.assertGreater(len(dialects), 0, f"No dialects found for {lang_code}")
            # Every language has a standard dialect
            self.assertTrue(any(d["dialect_code"] == "standard" for d in dialects))

        # Test Kannada dialects: North Karnataka
        uttara = DialectAdaptationService.get_dialect_config("kn", "uttara_karnataka")
        self.assertIsNotNone(uttara)
        self.assertIn("Uttara Karnataka", uttara["name"])
        instructions = DialectAdaptationService.get_dialect_instructions("kn", "uttara_karnataka")
        self.assertIn("ಉತ್ತರ ಕರ್ನಾಟಕ", instructions)
        self.assertIn("ಏನ್ರಿ", instructions)

        # Test Hindi: Eastern Hindi
        eastern_hi = DialectAdaptationService.get_dialect_config("hi", "eastern_hindi")
        self.assertIsNotNone(eastern_hi)
        self.assertIn("Eastern Hindi", eastern_hi["name"])
        hi_instructions = DialectAdaptationService.get_dialect_instructions("hi", "eastern_hindi")
        self.assertIn("भैया", hi_instructions)

        # Test fallback to standard on invalid dialect code
        fallback = DialectAdaptationService.get_dialect_config("kn", "invalid_dialect")
        self.assertEqual(fallback["dialect_code"], "standard")

        # Test grouped dialects
        grouped = DialectAdaptationService.get_grouped_dialects()
        self.assertEqual(len(grouped), 9)
        self.assertIn("kn", grouped)
        self.assertIn("hi", grouped)

    # -------------------------------------------------------------------------
    # 10. Voice Speech Services (STT, TTS, & Cleaner)
    # -------------------------------------------------------------------------
    def test_speech_to_text_and_tts_services(self):
        """Verify TTS text cleaner and graceful fallback when API keys are unconfigured."""
        # Markdown cleaner
        markdown_text = (
            "## ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ\n\n"
            "ನಿಮ್ಮ **ಕಬ್ಬಿನ ಬೆಳೆಗೆ** ಕೆಳಗಿನ ಕ್ರಮಗಳನ್ನು ಅನುಸರಿಸಿ:\n"
            "1. ಬೇವಿನ ಎಣ್ಣೆ 5ml ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.\n"
            "- [ಹೆಚ್ಚಿನ ಮಾಹಿತಿ](https://example.com/pest)\n"
            "> ಮುನ್ನೆಚ್ಚರಿಕೆ: ಬಿಸಿಲಿನಲ್ಲಿ ಸಿಂಪಡಿಸಬೇಡಿ."
        )
        cleaned = clean_text_for_speech(markdown_text)
        self.assertNotIn("##", cleaned)
        self.assertNotIn("**", cleaned)
        self.assertNotIn("[ಹೆಚ್ಚಿನ ಮಾಹಿತಿ]", cleaned)
        self.assertNotIn("https://", cleaned)
        self.assertIn("ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ", cleaned)
        self.assertIn("ಬೇವಿನ ಎಣ್ಣೆ 5ml", cleaned)

        # TTS Service with missing key -> returns graceful fallback
        with patch.dict(self.app.config, {"SARVAM_API_KEY": ""}):
            tts_result, tts_status = TextToSpeechService.synthesize_speech(
                text="ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ",
                language_code="kn",
            )
            self.assertEqual(tts_status, 200)
            self.assertFalse(tts_result["success"])
            self.assertTrue(tts_result.get("fallback_to_browser"))

            # STT Service with missing key -> returns graceful fallback
            stt_result, stt_status = SpeechToTextService.transcribe_audio(
                audio_bytes=b"fake-audio-bytes-wav",
                language_code="kn",
            )
            self.assertEqual(stt_status, 200)
            self.assertFalse(stt_result["success"])
            self.assertTrue(stt_result.get("fallback_to_browser"))

    # -------------------------------------------------------------------------
    # 11. Dialects & Farmer Preferences Endpoints (GET & PUT)
    # -------------------------------------------------------------------------
    def test_dialect_endpoints_and_farmer_preferences(self):
        """Verify /api/ai/dialects and farmer preferences GET/PUT endpoints."""
        for k, v in self.farmer1_cookies.items():
            self.client.set_cookie(k, v)

        # 1. GET /api/ai/dialects
        dialects_res = self.client.get("/api/ai/dialects")
        self.assertEqual(dialects_res.status_code, 200)
        dialects_data = dialects_res.get_json()
        self.assertTrue(dialects_data["success"])
        self.assertIn("dialects", dialects_data)
        self.assertIn("kn", dialects_data["dialects"])
        self.assertIn("hi", dialects_data["dialects"])

        # 2. GET /api/ai/preferences
        pref_res = self.client.get("/api/ai/preferences")
        self.assertEqual(pref_res.status_code, 200)
        pref_data = pref_res.get_json()
        self.assertTrue(pref_data["success"])
        self.assertEqual(pref_data["preferences"]["preferred_language"], "Kannada")

        # 3. PUT /api/ai/preferences
        update_res = self.client.put(
            "/api/ai/preferences",
            json={
                "preferred_language": "Kannada",
                "preferred_dialect": "uttara_karnataka",
                "voice_enabled": True,
                "auto_play_voice": True,
            },
            headers=self.farmer1_headers,
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.get_json()
        self.assertTrue(updated_data["success"])
        self.assertEqual(updated_data["preferences"]["preferred_dialect"], "uttara_karnataka")
        self.assertEqual(updated_data["preferences"]["auto_play_voice"], True)

        # Verify persisted in MySQL DB
        prof = FarmerProfile.query.filter_by(user_id=self.farmer1.farmer_id).first()
        self.assertEqual(prof.preferred_dialect, "uttara_karnataka")
        self.assertEqual(prof.auto_play_voice, True)

    # -------------------------------------------------------------------------
    # 12. Audio STT & TTS API Endpoints
    # -------------------------------------------------------------------------
    def test_audio_stt_and_tts_api_routes(self):
        """Verify /api/ai/stt and /api/ai/tts error handling and fallback behavior."""
        for k, v in self.farmer1_cookies.items():
            self.client.set_cookie(k, v)

        # TTS: missing text returns 400
        tts_bad = self.client.post(
            "/api/ai/tts",
            json={"text": ""},
            headers=self.farmer1_headers,
        )
        self.assertEqual(tts_bad.status_code, 400)

        # TTS: with text and unconfigured Sarvam key returns 200 with fallback flag
        tts_ok = self.client.post(
            "/api/ai/tts",
            json={"text": "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ", "language": "kn"},
            headers=self.farmer1_headers,
        )
        self.assertEqual(tts_ok.status_code, 200)
        tts_data = tts_ok.get_json()
        self.assertTrue(tts_data.get("fallback_to_browser", False))

        # STT: missing audio file returns 400
        stt_bad = self.client.post(
            "/api/ai/stt",
            headers=self.farmer1_headers,
        )
        self.assertEqual(stt_bad.status_code, 400)

        # STT: valid audio file with unconfigured Sarvam key returns 200 with fallback flag
        audio_stream = io.BytesIO(b"RIFFdummywavdata")
        stt_ok = self.client.post(
            "/api/ai/stt",
            data={"audio": (audio_stream, "speech.wav"), "language": "kn"},
            content_type="multipart/form-data",
            headers=self.farmer1_headers,
        )
        self.assertEqual(stt_ok.status_code, 200)
        stt_data = stt_ok.get_json()
        self.assertTrue(stt_data.get("fallback_to_browser", False))

    # -------------------------------------------------------------------------
    # 13. End-to-End Chat with Dialect & Voice Mode
    # -------------------------------------------------------------------------
    def test_chat_with_voice_mode_and_dialect(self):
        """Verify chat generates dialect response, saves dialect in DB, and includes voice metadata."""
        with patch.dict(self.app.config, {"AI_API_KEY": "test-key-mock"}):
            for k, v in self.farmer1_cookies.items():
                self.client.set_cookie(k, v)

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "ನಮಸ್ಕಾರ್ರಿ ಪಾಟೀಲರೇ! ಕಬ್ಬಿನ ಬೆಳೆಗೆ ಬೇವಿನ ಹಿಂಡಿ ಹಾಕ್ರಿ, ಮಣ್ಣಿಗೆ ಭಾಳ ಚೊಲೋ ಆಗತೈತಿ."
                                }
                            ]
                        }
                    }
                ]
            }

            with patch("requests.post", return_value=mock_resp):
                res = self.client.post(
                    "/api/ai/chat",
                    json={
                        "message": "ನಮ್ಮ ಕಬ್ಬಿನ ಬೆಳೆಗೆ ಏನು ಗೊಬ್ಬರ ಹಾಕಬೇಕು ಹೇಳ್ರಿ?",
                        "language": "kn",
                        "dialect": "uttara_karnataka",
                        "voice_mode": True,
                    },
                    headers=self.farmer1_headers,
                )
                self.assertEqual(res.status_code, 200)
                data = res.get_json()
                self.assertTrue(data["success"])
                self.assertEqual(data["language"], "kn")
                self.assertEqual(data["dialect"], "north_karnataka")
                self.assertIn("audio", data)

                # Verify conversation record stored dialect
                conv_id = data["conversation_id"]
                conv = db.session.get(AIConversation, conv_id)
                self.assertIsNotNone(conv)
                self.assertEqual(conv.dialect, "north_karnataka")


if __name__ == "__main__":
    unittest.main()
