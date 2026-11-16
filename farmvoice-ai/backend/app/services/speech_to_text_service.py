"""FarmVoice AI - Speech to Text (STT) Service.

Provides regional Indian speech transcription via Sarvam AI API
(models: saaras:v2 / saaras:v1) with seamless fallback to server-side
SpeechRecognition (Google Speech) and client-side SpeechRecognition.
"""

import io
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

# Sarvam & Google speech language code mapping
STT_LANG_MAP = {
    "kn": "kn-IN",  # Kannada
    "hi": "hi-IN",  # Hindi
    "te": "te-IN",  # Telugu
    "ta": "ta-IN",  # Tamil
    "ml": "ml-IN",  # Malayalam
    "mr": "mr-IN",  # Marathi
    "bn": "bn-IN",  # Bengali
    "pa": "pa-IN",  # Punjabi
    "en": "en-IN",  # Indian English
}


class SpeechToTextService:
    """Handles audio transcription through Sarvam AI or SpeechRecognition fallback."""

    @classmethod
    def transcribe_audio(cls, audio_bytes, filename="recording.wav", language_code="kn", content_type="audio/wav"):
        """Transcribe audio bytes using Sarvam AI Saaras model or Google Speech fallback.

        Returns a tuple: (response_dict, status_code).
        """
        api_key = current_app.config.get("SARVAM_API_KEY", "").strip() if current_app else ""
        base_url = current_app.config.get("SARVAM_BASE_URL", "https://api.sarvam.ai").rstrip("/") if current_app else "https://api.sarvam.ai"
        model = current_app.config.get("SARVAM_SPEECH_MODEL", "saaras:v2").strip() if current_app else "saaras:v2"

        lang_locale = STT_LANG_MAP.get(language_code, "kn-IN")

        # 1. Attempt Sarvam AI STT if API key is configured
        if api_key:
            endpoint = f"{base_url}/speech-to-text"
            headers = {"api-subscription-key": api_key}
            files = {"file": (filename, audio_bytes, content_type or "audio/wav")}
            data = {"model": model, "language_code": lang_locale}

            try:
                logger.info("Calling Sarvam STT | Language: %s | Model: %s", lang_locale, model)
                timeout = current_app.config.get("AI_TIMEOUT_SECONDS", 30) if current_app else 30
                response = requests.post(endpoint, headers=headers, files=files, data=data, timeout=timeout)

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
            except Exception as e:
                logger.warning("Sarvam STT request error: %s", str(e))

        # 2. Server-side SpeechRecognition Fallback (if audio format is WAV/PCM)
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            audio_file = io.BytesIO(audio_bytes)
            with sr.AudioFile(audio_file) as source:
                audio_data = recognizer.record(source)
                transcript = recognizer.recognize_google(audio_data, language=lang_locale)
                if transcript and transcript.strip():
                    return {
                        "success": True,
                        "provider": "google-stt",
                        "transcript": transcript.strip(),
                        "language_code": language_code,
                    }, 200
        except Exception as e:
            logger.info("Server-side SpeechRecognition fallback skipped/failed: %s", str(e))

        # 3. Client-side browser recognition fallback
        return {
            "success": False,
            "provider": "browser",
            "error_type": "BROWSER_FALLBACK",
            "fallback_to_browser": True,
            "message": "Using browser Web Speech recognition for voice transcription.",
        }, 200
