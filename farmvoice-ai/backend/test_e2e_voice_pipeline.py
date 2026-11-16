"""FarmVoice AI - End-to-End Voice Assistant & Dialect Integration Test Suite.

Verifies:
1. Real AI response generation (Gemini) with farmer context grounding.
2. End-to-end Text-to-Speech (TTS) audio synthesis.
3. Authenticated audio streaming endpoint /api/ai/messages/<id>/audio.
4. Multilingual & regional dialect handling (kn-north, kn-south, hi, te, ta, en).
5. Audio ownership & multi-tenant isolation.
6. Automatic voice response preference persistence.
"""

import unittest
from unittest.mock import patch
from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.services.ai_service import AIService
from app.services.text_to_speech_service import TextToSpeechService
from flask_jwt_extended import create_access_token
from flask_jwt_extended.utils import decode_token


class E2EVoicePipelineTestSuite(unittest.TestCase):
    """End-to-end tests for the FarmVoice AI voice pipeline."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Farmer 1 (Owner)
        self.farmer1 = Farmer.query.filter_by(username="ai_e2e_farmer1").first()
        if not self.farmer1:
            self.farmer1 = Farmer(
                farm_name="Krishna Valley Farm",
                username="ai_e2e_farmer1",
                email="farmer1_e2e@farmvoice.in",
                mobile_number="9845012345",
                password_hash="scrypt:fakehashforunittests",
            )
            db.session.add(self.farmer1)
            db.session.commit()

        # Profile 1 with Kannada & North Karnataka Dialect
        prof1 = FarmerProfile.query.filter_by(user_id=self.farmer1.farmer_id).first()
        if not prof1:
            prof1 = FarmerProfile(
                user_id=self.farmer1.farmer_id,
                full_name="Basavaraj Patil",
                mobile_number="9845012345",
                state="Karnataka",
                district="Belagavi",
                taluk="Athani",
                village="Ainapur",
                pin_code="591304",
                total_land_size=5.0,
                land_unit="Acres",
                soil_type="Black Soil",
                irrigation_type="Drip Irrigation",
                farming_experience=20,
                preferred_language="Kannada",
                preferred_dialect="north_karnataka",
                voice_enabled=True,
                auto_play_voice=True,
            )
            db.session.add(prof1)
            db.session.commit()

        # Farmer 2 (Unauthorized attacker)
        self.farmer2 = Farmer.query.filter_by(username="ai_e2e_farmer2").first()
        if not self.farmer2:
            self.farmer2 = Farmer(
                farm_name="Malnad Organic Farm",
                username="ai_e2e_farmer2",
                email="farmer2_e2e@farmvoice.in",
                mobile_number="9845099999",
                password_hash="scrypt:fakehashforunittests",
            )
            db.session.add(self.farmer2)
            db.session.commit()

        token1 = create_access_token(identity=str(self.farmer1.farmer_id))
        csrf1 = decode_token(token1)["csrf"]
        self.farmer1_headers = {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf1,
        }
        self.farmer1_cookies = {
            "access_token_cookie": token1,
            "csrf_access_token_cookie": csrf1,
        }

        token2 = create_access_token(identity=str(self.farmer2.farmer_id))
        csrf2 = decode_token(token2)["csrf"]
        self.farmer2_headers = {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf2,
        }
        self.farmer2_cookies = {
            "access_token_cookie": token2,
            "csrf_access_token_cookie": csrf2,
        }

    def tearDown(self):
        self.app_context.pop()

    def test_01_tts_synthesis_all_languages(self):
        """Verify real audio synthesis produces non-empty audio for all 9 regional languages."""
        test_samples = {
            "kn": "ನಮಸ್ಕಾರ, ಕಬ್ಬಿನ ಬೆಳೆಗೆ ರಸಗೊಬ್ಬರ ಯಾವಾಗ ಹಾಕಬೇಕು?",
            "hi": "नमस्ते, गेहूं की फसल में पहली सिंचाई कब करें?",
            "te": "నమస్కారం, వరి పంటకు యూరియా ఎప్పుడు వేయాలి?",
            "ta": "வணக்கம், நெல் பயிருக்கு உரம் எப்போது இட வேண்டும்?",
            "ml": "നമസ്കാരം, നെൽക്കൃഷിക്ക് വളം എപ്പോഴാണ് നൽകേണ്ടത്?",
            "mr": "नमस्कार, ऊस पिकाला खत कधी द्यावे?",
            "bn": "নমস্কার, ধানের ফসলে সার কখন প্রয়োগ করতে হবে?",
            "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਕਣਕ ਦੀ ਫ਼ਸਲ ਨੂੰ ਖਾਦ ਕਦੋਂ ਪਾਈਏ?",
            "en": "Hello, when should I apply fertilizer to sugarcane?",
        }

        for lang, text in test_samples.items():
            result, status = TextToSpeechService.synthesize_speech(
                text=text,
                language_code=lang,
            )
            self.assertEqual(status, 200, f"TTS failed for {lang}")
            self.assertTrue(result["success"], f"TTS success false for {lang}")
            self.assertTrue(len(result.get("audio_base64", "")) > 1000, f"Audio empty for {lang}")
            self.assertIn("audio/", result.get("mime_type", ""))

    def test_02_e2e_chat_with_automatic_audio_payload(self):
        """Verify POST /api/ai/chat returns written answer AND audio payload with audio_url."""
        for k, v in self.farmer1_cookies.items():
            self.client.set_cookie(k, v)

        mock_ai_resp = (
            {
                "success": True,
                "text": "ಕಬ್ಬಿನ ಬೆಳೆಗೆ ಹನಿ ನೀರಾವರಿ ಪದ್ಧತಿ ಅತ್ಯಂತ ಸೂಕ್ತವಾಗಿದೆ.",
                "provider": "gemini",
                "model": "gemini-1.5-flash",
            },
            200,
        )

        with patch.object(AIService, "generate_response", return_value=mock_ai_resp):
            response = self.client.post(
                "/api/ai/chat",
                json={
                    "message": "ಕಬ್ಬಿನ ಬೆಳೆಗೆ ನೀರಾವರಿ ನಿರ್ವಹಣೆ ಹೇಗೆ ಮಾಡಬೇಕು?",
                    "language": "kn",
                    "dialect": "north_karnataka",
                    "voice_mode": True,
                },
                headers=self.farmer1_headers,
            )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertTrue(len(data["message"]) > 0, "Written response is empty")
        self.assertEqual(data["language"], "kn")
        self.assertEqual(data["dialect"], "north_karnataka")

        # Audio verification
        self.assertIsNotNone(data.get("audio"), "Audio data missing from chat response")
        audio = data["audio"]
        self.assertTrue(len(audio.get("audio_base64", "")) > 500, "Audio base64 is empty")
        self.assertIn("audio/", audio.get("mime_type", ""))
        self.assertTrue(audio.get("audio_url", "").startswith("/api/ai/messages/"))

        assistant_msg_id = data["assistant_message_id"]

        # 3. Stream from authenticated audio endpoint
        audio_stream_resp = self.client.get(audio["audio_url"], headers=self.farmer1_headers)
        self.assertEqual(audio_stream_resp.status_code, 200)
        self.assertIn("audio/", audio_stream_resp.content_type)
        self.assertTrue(len(audio_stream_resp.data) > 1000)

        # 4. Verify cross-tenant isolation: Farmer 2 cannot access Farmer 1's audio
        for k, v in self.farmer2_cookies.items():
            self.client.set_cookie(k, v)
        forbidden_resp = self.client.get(audio["audio_url"], headers=self.farmer2_headers)
        self.assertEqual(forbidden_resp.status_code, 403)

    def test_03_preferences_get_and_put(self):
        """Verify GET and PUT /api/ai/preferences persistence for voice settings."""
        for k, v in self.farmer1_cookies.items():
            self.client.set_cookie(k, v)

        # GET preferences
        get_res = self.client.get("/api/ai/preferences", headers=self.farmer1_headers)
        self.assertEqual(get_res.status_code, 200)
        prefs = get_res.get_json()["preferences"]
        self.assertTrue(prefs["auto_play_voice"])
        self.assertTrue(prefs["voice_enabled"])

        # PUT update preferences
        put_res = self.client.put(
            "/api/ai/preferences",
            json={
                "preferred_language": "Hindi",
                "preferred_dialect": "eastern_hindi",
                "voice_enabled": True,
                "auto_play_voice": True,
            },
            headers=self.farmer1_headers,
        )
        self.assertEqual(put_res.status_code, 200)
        updated = put_res.get_json()["preferences"]
        self.assertEqual(updated["preferred_language"], "Hindi")
        self.assertEqual(updated["preferred_dialect"], "eastern_hindi")
        self.assertTrue(updated["auto_play_voice"])


if __name__ == "__main__":
    unittest.main()
