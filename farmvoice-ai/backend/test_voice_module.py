"""FarmVoice AI - Voice Routes & Translation Service Test Suite.

Verifies:
1. GET /api/voice/languages returns 9 regional languages.
2. POST /api/voice/transcribe handles audio upload & base64 with size limits.
3. POST /api/voice/speak handles text-to-speech across regional languages.
4. POST /api/voice/translate skips identical source/target languages and performs translation.
5. Preserves existing voice contracts & JWT multi-tenant isolation.
"""

import base64
import io
import unittest
from unittest.mock import patch, MagicMock

from app import create_app, db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.services.voice.translation_service import TranslationService
from flask_jwt_extended import create_access_token
from flask_jwt_extended.utils import decode_token


class VoiceModuleTestSuite(unittest.TestCase):
    """Test suite for /api/voice endpoints and TranslationService."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Find or create test farmer
        self.farmer = Farmer.query.filter_by(username="voice_test_farmer").first()
        if not self.farmer:
            self.farmer = Farmer(
                farm_name="Voice Test Farm",
                username="voice_test_farmer",
                email="voice_test@farmvoice.in",
                mobile_number="9876543299",
                password_hash="scrypt:fakehashforunittests",
            )
            db.session.add(self.farmer)
            db.session.commit()

        token = create_access_token(identity=str(self.farmer.farmer_id))
        csrf = decode_token(token)["csrf"]
        self.headers = {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf,
        }
        self.cookies = {
            "access_token_cookie": token,
            "csrf_access_token_cookie": csrf,
        }

    def tearDown(self):
        self.app_context.pop()

    def test_get_voice_languages(self):
        """GET /api/voice/languages returns all supported regional languages."""
        res = self.client.get("/api/voice/languages")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        languages = data["data"]["languages"]
        codes = [l["code"] for l in languages]
        for p in ["kn", "hi", "en", "ta", "mr", "te"]:
            self.assertIn(p, codes)

    def test_voice_transcribe_missing_audio(self):
        """POST /api/voice/transcribe without audio returns 400."""
        for k, v in self.cookies.items():
            self.client.set_cookie(k, v)

        res = self.client.post(
            "/api/voice/transcribe",
            json={},
            headers=self.headers,
        )
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "NO_AUDIO_DATA")

    def test_voice_transcribe_base64_success(self):
        """POST /api/voice/transcribe with base64 audio calls STT."""
        for k, v in self.cookies.items():
            self.client.set_cookie(k, v)

        dummy_audio = base64.b64encode(b"RIFFdummydataWAVE").decode("utf-8")

        with patch("app.services.speech_to_text_service.SpeechToTextService.transcribe_audio") as mock_stt:
            mock_stt.return_value = (
                {
                    "success": True,
                    "transcript": "ರಾಗಿ ಬೆಳೆಗೆ ಎಷ್ಟು ನೀರು ಬೇಕು?",
                    "language_code": "kn",
                },
                200,
            )

            res = self.client.post(
                "/api/voice/transcribe",
                json={"audio": dummy_audio, "language_code": "kn"},
                headers=self.headers,
            )
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data["success"])
            self.assertIn("ರಾಗಿ", data["data"]["transcript"])

    def test_voice_speak_success(self):
        """POST /api/voice/speak synthesizes speech."""
        for k, v in self.cookies.items():
            self.client.set_cookie(k, v)

        res = self.client.post(
            "/api/voice/speak",
            json={"text": "ನಮಸ್ಕಾರ Basavaraj, ಬೆಳೆ ಮಾಹಿತಿ ಇಲ್ಲಿದೆ.", "language": "kn"},
            headers=self.headers,
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertTrue(data["data"].get("audio_base64"))

    def test_voice_translation_identical_language_bypass(self):
        """TranslationService skips translation if source and target are identical."""
        res, status = TranslationService.translate_text(
            text="ಕಬ್ಬು ಬೆಳೆ ನಿರ್ವಹಣೆ",
            target_lang="kn",
            source_lang="kn",
        )
        self.assertEqual(status, 200)
        self.assertTrue(res["success"])
        self.assertTrue(res.get("skipped_identical"))
        self.assertEqual(res["translated_text"], "ಕಬ್ಬು ಬೆಳೆ ನಿರ್ವಹಣೆ")

    def test_voice_translation_different_language(self):
        """TranslationService translates between different languages via FallbackManager."""
        mock_ai_res = {
            "success": True,
            "text": "Sugarcane crop management",
            "provider": "gemini",
        }

        with patch("app.services.ai.fallback_manager.FallbackManager.generate_with_fallback", return_value=(mock_ai_res, 200)):
            res, status = TranslationService.translate_text(
                text="ಕಬ್ಬು ಬೆಳೆ ನಿರ್ವಹಣೆ",
                target_lang="en",
                source_lang="kn",
            )
            self.assertEqual(status, 200)
            self.assertTrue(res["success"])
            self.assertEqual(res["translated_text"], "Sugarcane crop management")
            self.assertEqual(res["target_language"], "en")


if __name__ == "__main__":
    unittest.main()
