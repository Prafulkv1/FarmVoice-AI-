"""FarmVoice AI - Reusable Agricultural Translation Service (Phase 5).

Translates agricultural content only when explicitly required, preventing
unnecessary double-translation when the AI model can directly generate in
the target language. Preserves crop names, scientific names, units,
and agricultural chemicals accurately.
"""

import logging
from typing import Dict, Any, Tuple, Optional
from app.services.language_service import LanguageService
from app.services.language_detection_service import LanguageDetectionService
from app.services.ai.fallback_manager import FallbackManager

logger = logging.getLogger(__name__)

TRANSLATION_SYSTEM_PROMPT = """You are an expert agricultural translator specializing in Indian languages.
Translate the provided text accurately from {source_name} to {target_name} ({target_native}) using proper {target_name} script.

CRITICAL TRANSLATION RULES:
1. Preserve Agricultural Accuracy: Do NOT incorrectly translate crop names (e.g., Sugarcane, Ragi, Arecanut, Jowar), crop varieties, scientific binomial names, or chemical terms.
2. Preserve Units: Keep land and measurement units unchanged (e.g. Acres, Guntas, Bigha, kg, g, ml, liters, ppm, pH).
3. Preserve Formatting: Maintain all Markdown formatting, bullet points, numbers, and newlines exactly as in the source text.
4. Output Only Translation: Return ONLY the translated text. Do NOT add notes, greetings, explanations, or quotes.
"""


class TranslationService:
    """Provides language translation with source detection and bypass for identical languages."""

    @classmethod
    def translate_text(
        cls,
        text: str,
        target_lang: str,
        source_lang: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], int]:
        """Translate text to the target language.

        Returns a tuple: (result_dict, status_code).
        """
        if not text or not text.strip():
            return {
                "success": False,
                "error_type": "EMPTY_TEXT",
                "message": "No text provided for translation.",
            }, 400

        if len(text) > 6000:
            return {
                "success": False,
                "error_type": "TEXT_TOO_LONG",
                "message": "Text exceeds maximum translation length of 6000 characters.",
            }, 400

        target_code = LanguageService.normalize_language_code(target_lang)

        # 1. Resolve source language
        if not source_lang or source_lang.lower() == "auto":
            detection = LanguageDetectionService.detect_language(text)
            source_code = detection["detected_language"]
        else:
            source_code = LanguageService.normalize_language_code(source_lang)

        # 2. Optimization: Avoid unnecessary translation if source and target match
        if source_code == target_code:
            logger.debug(
                "Source and target languages are identical (%s). Skipping translation.",
                target_code,
            )
            return {
                "success": True,
                "translated_text": text.strip(),
                "source_language": source_code,
                "target_language": target_code,
                "skipped_identical": True,
            }, 200

        target_info = LanguageService.get_language_info(target_code)
        source_info = LanguageService.get_language_info(source_code)

        system_prompt = TRANSLATION_SYSTEM_PROMPT.format(
            source_name=source_info["name"],
            target_name=target_info["name"],
            target_native=target_info["native_name"],
        )

        user_prompt = f"Text to translate into {target_info['name']}:\n\n{text.strip()}"

        # 3. Call multi-provider fallback engine
        ai_res, ai_status = FallbackManager.generate_with_fallback(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            conversation_history=[],
            max_retries=1,
        )

        if ai_status == 200 and ai_res.get("success"):
            translated = ai_res.get("text", "").strip()
            return {
                "success": True,
                "translated_text": translated,
                "source_language": source_code,
                "target_language": target_code,
                "provider": ai_res.get("provider"),
                "fallback_used": ai_res.get("fallback_used", False),
            }, 200

        # Translation failure
        return {
            "success": False,
            "error_type": "TRANSLATION_FAILED",
            "message": "Translation service is temporarily unavailable.",
            "source_language": source_code,
            "target_language": target_code,
            "details": ai_res.get("details", {}),
        }, ai_status if ai_status >= 400 else 502
