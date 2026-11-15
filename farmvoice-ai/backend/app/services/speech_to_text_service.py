"""FarmVoice AI - Speech to Text (STT) Service.

Provides regional Indian speech transcription via Sarvam AI API
(models: saaras:v2 / saaras:v1) with seamless fallback to client-side
SpeechRecognition when external credentials are absent.
"""

import base64
import io
import logging
import requests
from flask import current_app
from app.services.language_service import LanguageService

logger = logging.getLogger(__name__)

# Sarvam language code mapping
SARVAM_STT_LANG_MAP = {
    "kn": "kn-IN",
    "hi": "hi-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "pa": "pa-IN",
    "en": "en-IN",
}


class SpeechToTextService:
    """Handles audio transcription through Sarvam AI or browser fallback."""

    @classmethod
    def transcribe_audio(cls, audio_bytes, filename="recording.wav", language_code="kn", content_type="audio/wav"):
        """Transcribe audio bytes using Sarvam AI Saaras model.

        Returns a tuple: (response_dict, status_code).
        """
        api_key = current_app.config.get("SARVAM_API_KEY", "").strip()
        base_url = current_app.config.get("SARVAM_BASE_URL", "https://api.sarvam.ai").rstrip("/")
        model = current_app.config.get("SARVAM_SPEECH_MODEL", "saaras:v2").strip()

        # Check if Sarvam API key is configured
        if not api_key:
            return {
                "success": False,
                "provider": "browser",
                "error_type": "NO_SARVAM_KEY",
                "fallback_to_browser": True,
                "message": (
                    "Sarvam AI API key is not configured in backend/.env (SARVAM_API_KEY). "
                    "Browser speech recognition is active."
                ),
            }, 200

        sarvam_lang = SARVAM_STT_LANG_MAP.get(language_code, "kn-IN")
        endpoint = f"{base_url}/speech-to-text"

        headers = {
            "api-subscription-key": api_key,
        }

        # Prepare file payload
        files = {
            "file": (filename, audio_bytes, content_type or "audio/wav"),
        }

        data = {
            "model": model,
            "language_code": sarvam_lang,
        }

        try:
            logger.info("Calling Sarvam STT | Language: %s | Model: %s", sarvam_lang, model)
            response = requests.post(
                endpoint,
                headers=headers,
                files=files,
                data=data,
                timeout=current_app.config.get("AI_TIMEOUT_SECONDS", 30),
            )

            if response.status_code == 200:
                result = response.json()
                transcript = result.get("transcript", "").strip()
                return {
                    "success": True,
                    "provider": "sarvam",
                    "model": model,
                    "transcript": transcript,
                    "language_code": language_code,
                }, 200

            logger.warning("Sarvam STT failed HTTP %d: %s", response.status_code, response.text[:200])
            return {
                "success": False,
                "provider": "sarvam",
                "error_type": "API_ERROR",
                "status_code": response.status_code,
                "fallback_to_browser": True,
                "message": f"Sarvam AI speech recognition error (HTTP {response.status_code}).",
            }, 502

        except requests.exceptions.Timeout:
            logger.error("Sarvam STT timed out.")
            return {
                "success": False,
                "provider": "sarvam",
                "error_type": "TIMEOUT",
                "fallback_to_browser": True,
                "message": "Speech recognition timed out. Falling back to browser speech recognition.",
            }, 504

        except Exception as e:
            logger.exception("Unexpected error in Sarvam STT: %s", str(e))
            return {
                "success": False,
                "provider": "sarvam",
                "error_type": "EXCEPTION",
                "fallback_to_browser": True,
                "message": "Speech transcription failed. Browser speech recognition is available.",
            }, 500
