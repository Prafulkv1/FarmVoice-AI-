"""FarmVoice AI - Multilingual AI Assistant Test Suite (Phase 2).

Tests the 6 priority languages:
1. Kannada (kn)
2. Hindi (hi)
3. English (en)
4. Tamil (ta)
5. Marathi (mr)
6. Telugu (te)

Verifies:
- Prompt builder directives across all 6 languages.
- Language normalization & ISO code mapping.
- Language detection for Indic scripts & transliterated queries.
- Direct response generation without robotic translation.
- Agricultural safety guardrails (IPM advice, chemical caution, no fake subsidies).
- Farmer context grounding (soil type, crops, location).
- Audio TTS synthesis capability for each of the 6 languages.
"""

import unittest
from unittest.mock import patch, MagicMock

from app import create_app
from app.utils.ai_prompt_builder import AIPromptBuilder
from app.services.language_service import LanguageService, SUPPORTED_LANGUAGES
from app.services.language_detection_service import LanguageDetectionService
from app.services.text_to_speech_service import TextToSpeechService, clean_text_for_speech
from app.services.ai_service import AIService


class MultilingualAITestSuite(unittest.TestCase):
    """Test suite for Phase 2: Multilingual AI generation across 6 priority languages."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    # -------------------------------------------------------------------------
    # 1. Target Languages Availability & Normalization
    # -------------------------------------------------------------------------
    def test_six_priority_languages_available(self):
        """Verify all 6 priority languages exist with proper metadata."""
        priority_codes = ["kn", "hi", "en", "ta", "mr", "te"]
        supported = {lang["code"]: lang for lang in LanguageService.get_supported_languages()}

        for code in priority_codes:
            self.assertIn(code, supported, f"Language {code} must be in supported languages.")
            info = supported[code]
            self.assertTrue(info["name"])
            self.assertTrue(info["native_name"])
            self.assertTrue(info["speech_code"])
            self.assertTrue(info["welcome"])

    def test_language_code_normalization(self):
        """Verify diverse representations map correctly to 2-letter ISO codes."""
        mappings = [
            ("Kannada", "kn"),
            ("kannada", "kn"),
            ("kn-IN", "kn"),
            ("Hindi", "hi"),
            ("hi-in", "hi"),
            ("English", "en"),
            ("en-US", "en"),
            ("Tamil", "ta"),
            ("ta-in", "ta"),
            ("Marathi", "mr"),
            ("mr-in", "mr"),
            ("Telugu", "te"),
            ("te-in", "te"),
            ("unknown_lang", "en"),  # Safe default
            ("", "en"),
        ]
        for input_val, expected in mappings:
            normalized = LanguageService.normalize_language_code(input_val)
            self.assertEqual(normalized, expected, f"Failed normalizing '{input_val}'")

    # -------------------------------------------------------------------------
    # 2. Prompt Builder Directives for Each Language
    # -------------------------------------------------------------------------
    def test_prompt_builder_language_directives(self):
        """Verify AIPromptBuilder generates proper language and safety directives for each language."""
        priority_specs = [
            ("kn", "Kannada", "ಕನ್ನಡ"),
            ("hi", "Hindi", "हिन्दी"),
            ("en", "English", "English"),
            ("ta", "Tamil", "தமிழ்"),
            ("mr", "Marathi", "मराठी"),
            ("te", "Telugu", "తెలుగు"),
        ]

        for code, eng_name, native_name in priority_specs:
            sys_prompt = AIPromptBuilder.build_system_prompt(language_code=code)
            self.assertIn(eng_name, sys_prompt)
            self.assertIn(native_name, sys_prompt)
            # Guardrails must be present in system prompt
            self.assertIn("CRITICAL AGRICULTURAL SAFETY & GROUNDING GUARDRAILS", sys_prompt)
            self.assertIn("Understandable Vocabulary", sys_prompt)
            self.assertIn("Chemical & Dosage Safety", sys_prompt)
            self.assertIn("Government Schemes & Subsidies", sys_prompt)

            user_prompt = AIPromptBuilder.build_user_prompt(
                context_str="Crop: Sugarcane | Soil: Black Soil",
                question="What is the best irrigation schedule?",
                language_code=code,
            )
            self.assertIn("=== VERIFIED FARMER & FIELD CONTEXT ===", user_prompt)
            self.assertIn("Crop: Sugarcane", user_prompt)
            self.assertIn(eng_name, user_prompt)
            self.assertIn(native_name, user_prompt)

    # -------------------------------------------------------------------------
    # 3. Language Detection for 6 Target Languages
    # -------------------------------------------------------------------------
    def test_language_detection_indic_scripts(self):
        """Verify automatic script detection for all 6 target languages."""
        test_queries = [
            ("kn", "ನನ್ನ ಹೊಲದಲ್ಲಿ ಅಡಿಕೆ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ, ಏನು ಮಾಡಬೇಕು?"),
            ("hi", "गेहूं की फसल में दीमक का प्रकोप रोकने के उपाय बताएं।"),
            ("en", "What is the recommended spacing for banana plantation?"),
            ("ta", "வாழை சாகுபடியில் சொட்டு நீர் பாசனம் அமைப்பது எப்படி?"),
            ("mr", "सोयाबीन पिकावर कीड पडली आहे, कोणते औषध फवारावे?"),
            ("te", "వరి పంటలో అగ్గితెగులు నివారణకు ఎలాంటి చర్యలు తీసుకోవాలి?"),
        ]

        for expected_lang, text in test_queries:
            detection = LanguageDetectionService.detect_language(text)
            self.assertEqual(
                detection["detected_language"],
                expected_lang,
                f"Failed detection for '{text[:25]}...'. Expected {expected_lang}, got {detection['detected_language']}",
            )

    # -------------------------------------------------------------------------
    # 4. Multilingual Direct Generation & Grounding
    # -------------------------------------------------------------------------
    def test_direct_generation_six_languages(self):
        """Verify direct AI response generation across all six languages with mock responses."""
        test_cases = [
            {
                "lang": "kn",
                "question": "ದಾಳಿಂಬೆ ಬೆಳೆಯಲ್ಲಿ ದುಂಡಾಣು ಅಂಗಮಾರಿ ರೋಗ ನಿಯಂತ್ರಣ ಹೇಗೆ?",
                "mock_answer": "ದಾಳಿಂಬೆ ಬೆಳೆಯಲ್ಲಿ ದುಂಡಾಣು ಅಂಗಮಾರಿ (Bacterial Blight) ರೋಗಕ್ಕೆ ಬೋರ್ಡೋ ದ್ರಾವಣ 1% ಸಿಂಪಡಿಸಿ.",
            },
            {
                "lang": "hi",
                "question": "चना फसल में उकठा रोग की रोकथाम कैसे करें?",
                "mock_answer": "चना में उकठा (Wilt) रोग से बचाव के लिए बीजोपचार ट्राइकोडर्मा विरिडी से करें।",
            },
            {
                "lang": "en",
                "question": "How to control fall armyworm in maize?",
                "mock_answer": "Deploy pheromone traps at 5 per acre and use neem-based formulations early.",
            },
            {
                "lang": "ta",
                "question": "நெல் பயிரில் இலை சுருட்டு புழு கட்டுப்பாடு என்ன?",
                "mock_answer": "வேப்பங்கொட்டை சாறு 5% தெளிக்கவும் மற்றும் விளக்கு பொறி அமைக்கவும்.",
            },
            {
                "lang": "mr",
                "question": "कपाशीवरील बोंडअळी नियंत्रणासाठी कोणते उपाय करावेत?",
                "mock_answer": "कपाशीवरील बोंडअळीसाठी कामगंध सापळे एकरी 5 लावा आणि जैविक कीटकनाशक वापरा.",
            },
            {
                "lang": "te",
                "question": "మిరప తోటలో తామర పురుగుల నివారణ ఎలా?",
                "mock_answer": "పసుపు, నీలి రంగు జిగురు అట్టలను ఎకరానికి 20 చొప్పున అమర్చండి.",
            },
        ]

        for case in test_cases:
            mock_gemini_resp = MagicMock()
            mock_gemini_resp.status_code = 200
            mock_gemini_resp.json.return_value = {
                "candidates": [
                    {"content": {"parts": [{"text": case["mock_answer"]}]}}
                ]
            }

            with patch.dict(self.app.config, {"GEMINI_API_KEY": "test-key"}):
                with patch("requests.post", return_value=mock_gemini_resp):
                    res, status = AIService.generate_response(
                        question=case["question"],
                        context_str="Farmer: Test | Soil: Red Loam",
                        language_code=case["lang"],
                    )

                    self.assertEqual(status, 200)
                    self.assertTrue(res["success"])
                    self.assertEqual(res["text"], case["mock_answer"])

    # -------------------------------------------------------------------------
    # 5. Spoken Audio Synthesis (TTS) Across All 6 Priority Languages
    # -------------------------------------------------------------------------
    def test_clean_text_for_speech_all_languages(self):
        """Verify markdown syntax is cleanly stripped for natural speech."""
        raw_markdown = """
        # ಬೆಳೆ ಸಲಹೆ
        **ಕಬ್ಬು ಬೆಳೆ** ನಿರ್ವಹಣೆ:
        - *ನೀರು*: ಹನಿ ನೀರಾವರಿ ಬಳಸಿ
        - ವಿವರಗಳಿಗೆ [ಇಲ್ಲಿ ನೋಡಿ](https://example.com)
        1. ಮೊದಲ ಹಂತ: ಗೊಬ್ಬರ ಹಾಕಿ
        `NPK 10:26:26`
        """
        cleaned = clean_text_for_speech(raw_markdown)
        self.assertNotIn("#", cleaned)
        self.assertNotIn("**", cleaned)
        self.assertNotIn("`", cleaned)
        self.assertNotIn("[ಇಲ್ಲಿ ನೋಡಿ]", cleaned)
        self.assertIn("ಕಬ್ಬು ಬೆಳೆ ನಿರ್ವಹಣೆ", cleaned)

    def test_gtts_synthesis_six_languages(self):
        """Verify server-side TTS (gTTS) produces valid audio for each of the 6 languages."""
        texts = [
            ("kn", "ನಮಸ್ಕಾರ, ಕೃಷಿ ಸಲಹೆಗಾರರಿಗೆ ಸುಸ್ವಾಗತ."),
            ("hi", "नमस्ते, फार्मवॉयस कृषि सहायक में आपका स्वागत है।"),
            ("en", "Hello, welcome to FarmVoice agricultural assistant."),
            ("ta", "வணக்கம், பார்ம்வாய்ஸ் வேளாண் உதவிக்கு வரவேற்கிறோம்."),
            ("mr", "नमस्कार, फार्मव्हॉईस शेती सल्लागारामध्ये आपले स्वागत आहे."),
            ("te", "నమస్కారం, ఫార్మ్‌వాయిస్ వ్యవసాయ సహాయకుడికి స్వాగతం."),
        ]

        for lang_code, text in texts:
            # Server-side gTTS generation
            res, status = TextToSpeechService.synthesize_speech(
                text=text,
                language_code=lang_code,
            )
            self.assertEqual(status, 200, f"TTS synthesis failed for language '{lang_code}'")
            self.assertTrue(res.get("success"), f"TTS marked unsuccessful for '{lang_code}': {res}")
            self.assertTrue(res.get("audio_base64"), f"Audio base64 missing for '{lang_code}'")
            self.assertEqual(res.get("language_code"), lang_code)


if __name__ == "__main__":
    unittest.main()
