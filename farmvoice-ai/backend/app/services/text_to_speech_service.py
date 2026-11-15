"""FarmVoice AI - Text to Speech (TTS) Service.

Synthesizes AI agricultural guidance into natural regional spoken audio
using Sarvam AI (model: bulbul:v1) with authentic regional Indian voices
and automatic fallback to client-side SpeechSynthesis.
"""

import re
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

# Sarvam TTS target language mapping
SARVAM_TTS_LANG_MAP = {
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

# Recommended natural regional voices by language
DEFAULT_VOICES = {
    "kn": "meera",
    "hi": "meera",
    "te": "pavithra",
    "ta": "pavithra",
    "ml": "maitri",
    "mr": "meera",
    "bn": "amartya",
    "pa": "arvind",
    "en": "meera",
}


def clean_text_for_speech(markdown_text):
    """Strip markdown formatting, symbols, and links for clean speech synthesis."""
    if not markdown_text:
        return ""
    text = markdown_text
    # Remove markdown headings
    text = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)
    # Remove bold & italics
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"_{1,2}(.*?)_{1,2}", r"\1", text)
    # Remove links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Remove inline / block code
    text = re.sub(r"`{1,3}[^`]*`{1,3}", "", text)
    # Remove list bullet markers
    text = re.sub(r"^[\*\-\+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)
    # Clean multiple spaces and newlines into natural pauses
    text = re.sub(r"\n{2,}", ". ", text)
    text = re.sub(r"\n", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


class TextToSpeechService:
    """Handles text-to-speech generation via Sarvam AI with browser fallback."""

    @classmethod
    def synthesize_speech(cls, text, language_code="kn", speaker=None, pace=1.0):
        """Generate spoken audio for text in the requested regional language.

        Returns a tuple: (result_dict, status_code).
        """
        api_key = current_app.config.get("SARVAM_API_KEY", "").strip()
        base_url = current_app.config.get("SARVAM_BASE_URL", "https://api.sarvam.ai").rstrip("/")
        model = current_app.config.get("SARVAM_TTS_MODEL", "bulbul:v1").strip()

        # Check if Sarvam API key is configured
        if not api_key:
            return {
                "success": False,
                "provider": "browser",
                "error_type": "NO_SARVAM_KEY",
                "fallback_to_browser": True,
                "message": (
                    "Sarvam AI API key is not configured in backend/.env (SARVAM_API_KEY). "
                    "Browser speech synthesis will be used."
                ),
            }, 200

        clean_text = clean_text_for_speech(text)
        if not clean_text:
            return {"success": False, "message": "No speakable text provided."}, 400

        # Truncate text for single-turn audio (Sarvam limits input to ~500 characters per call)
        # We can take the first 500 characters or split into sentences
        speech_text = clean_text[:500] if len(clean_text) > 500 else clean_text

        target_lang = SARVAM_TTS_LANG_MAP.get(language_code, "kn-IN")
        chosen_speaker = speaker or DEFAULT_VOICES.get(language_code, "meera")

        endpoint = f"{base_url}/text-to-speech"
        headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        }

        payload = {
            "inputs": [speech_text],
            "target_language_code": target_lang,
            "speaker": chosen_speaker,
            "pitch": 0,
            "pace": float(pace or 1.0),
            "loudness": 1.5,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": model,
        }

        try:
            logger.info("Calling Sarvam TTS | Language: %s | Speaker: %s", target_lang, chosen_speaker)
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=current_app.config.get("AI_TIMEOUT_SECONDS", 30),
            )

            if response.status_code == 200:
                result = response.json()
                audios = result.get("audios", [])
                if audios and len(audios) > 0:
                    return {
                        "success": True,
                        "provider": "sarvam",
                        "model": model,
                        "language_code": language_code,
                        "speaker": chosen_speaker,
                        "audio_base64": audios[0],
                        "mime_type": "audio/wav",
                    }, 200

                return {
                    "success": False,
                    "provider": "sarvam",
                    "error_type": "EMPTY_AUDIO",
                    "fallback_to_browser": True,
                    "message": "Sarvam AI did not return audio data.",
                }, 502

            logger.warning("Sarvam TTS returned HTTP %d: %s", response.status_code, response.text[:200])
            return {
                "success": False,
                "provider": "sarvam",
                "error_type": "API_ERROR",
                "status_code": response.status_code,
                "fallback_to_browser": True,
                "message": f"Sarvam AI TTS error (HTTP {response.status_code}).",
            }, 502

        except requests.exceptions.Timeout:
            logger.error("Sarvam TTS timed out.")
            return {
                "success": False,
                "provider": "sarvam",
                "error_type": "TIMEOUT",
                "fallback_to_browser": True,
                "message": "TTS request timed out. Browser speech synthesis is available.",
            }, 504

        except Exception as e:
            logger.exception("Unexpected error in Sarvam TTS: %s", str(e))
            return {
                "success": False,
                "provider": "sarvam",
                "error_type": "EXCEPTION",
                "fallback_to_browser": True,
                "message": "Speech synthesis failed. Browser speech synthesis is available.",
            }, 500
