"""FarmVoice AI - Text to Speech (TTS) Service.

Synthesizes AI agricultural guidance into natural regional spoken audio
using Sarvam AI (model: bulbul:v1) with authentic regional Indian voices
and automatic server-side Google TTS (gTTS) fallback to ensure reliable,
audible playback across all 9 supported regional languages.
"""

import base64
import io
import logging
import re
import threading
import time
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

# Recommended natural regional voices by language for Sarvam AI
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

# gTTS language code mapping for all 9 supported Indian languages
GTTS_LANG_MAP = {
    "kn": "kn",  # Kannada
    "hi": "hi",  # Hindi
    "te": "te",  # Telugu
    "ta": "ta",  # Tamil
    "ml": "ml",  # Malayalam
    "mr": "mr",  # Marathi
    "bn": "bn",  # Bengali
    "pa": "pa",  # Punjabi (Gurmukhi)
    "en": "en",  # English
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


class AudioCacheManager:
    """Thread-safe in-memory cache for generated audio files with TTL expiration."""

    def __init__(self, ttl_seconds=7200, max_items=200):
        self._cache = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds
        self._max_items = max_items

    def get(self, key):
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            if time.time() - entry["timestamp"] > self._ttl:
                del self._cache[key]
                return None
            return entry

    def set(self, key, audio_bytes, mime_type, provider="google-tts"):
        with self._lock:
            # Clean expired items if cache exceeds max size
            if len(self._cache) >= self._max_items:
                now = time.time()
                expired = [k for k, v in self._cache.items() if now - v["timestamp"] > self._ttl]
                for k in expired:
                    del self._cache[k]
                if len(self._cache) >= self._max_items:
                    # Remove oldest entry
                    oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]["timestamp"])
                    del self._cache[oldest_key]

            self._cache[key] = {
                "audio_bytes": audio_bytes,
                "mime_type": mime_type,
                "provider": provider,
                "timestamp": time.time(),
            }

    def clear(self):
        with self._lock:
            self._cache.clear()


# Global audio cache singleton
_audio_cache = AudioCacheManager()


class TextToSpeechService:
    """Handles text-to-speech generation via Sarvam AI with gTTS and browser fallbacks."""

    @classmethod
    def get_cached_audio(cls, message_id):
        """Retrieve cached audio bytes and MIME type for a message ID."""
        return _audio_cache.get(message_id)

    @classmethod
    def store_cached_audio(cls, message_id, audio_bytes, mime_type="audio/mpeg", provider="google-tts"):
        """Store generated audio for a message in cache."""
        _audio_cache.set(message_id, audio_bytes, mime_type, provider)

    @classmethod
    def synthesize_speech(cls, text, language_code="kn", speaker=None, pace=1.0, message_id=None):
        """Generate spoken audio for text in the requested regional language.

        Tries Sarvam AI if configured; seamlessly falls back to server-side gTTS
        to guarantee actual audible audio across all 9 Indian languages.
        Returns a tuple: (result_dict, status_code).
        """
        clean_text = clean_text_for_speech(text)
        if not clean_text:
            return {"success": False, "message": "No speakable text provided."}, 400

        # Check if already cached for this message_id
        if message_id:
            cached = cls.get_cached_audio(message_id)
            if cached:
                b64 = base64.b64encode(cached["audio_bytes"]).decode("utf-8")
                return {
                    "success": True,
                    "provider": cached["provider"],
                    "language_code": language_code,
                    "mime_type": cached["mime_type"],
                    "audio_base64": b64,
                    "cached": True,
                }, 200

        api_key = current_app.config.get("SARVAM_API_KEY", "").strip() if current_app else ""
        base_url = current_app.config.get("SARVAM_BASE_URL", "https://api.sarvam.ai").rstrip("/") if current_app else "https://api.sarvam.ai"
        model = current_app.config.get("SARVAM_TTS_MODEL", "bulbul:v1").strip() if current_app else "bulbul:v1"

        # 1. Attempt Sarvam AI if API key is present
        if api_key:
            sarvam_result = cls._synthesize_sarvam(
                clean_text=clean_text,
                language_code=language_code,
                api_key=api_key,
                base_url=base_url,
                model=model,
                speaker=speaker,
                pace=pace,
            )
            if sarvam_result and sarvam_result.get("success"):
                audio_bytes = sarvam_result.pop("audio_bytes", None)
                if message_id and audio_bytes:
                    cls.store_cached_audio(
                        message_id,
                        audio_bytes,
                        sarvam_result.get("mime_type", "audio/wav"),
                        provider="sarvam",
                    )
                return sarvam_result, 200
            else:
                logger.warning(
                    "Sarvam TTS unavailable or failed: %s. Falling back to server-side gTTS.",
                    sarvam_result.get("message") if sarvam_result else "Unknown error",
                )

        # 2. Server-side gTTS Generation (Reliable, free, natural regional speech)
        gtts_result = cls._synthesize_gtts(clean_text, language_code)
        if gtts_result and gtts_result.get("success"):
            audio_bytes = gtts_result.pop("audio_bytes", None)
            if message_id and audio_bytes:
                cls.store_cached_audio(
                    message_id,
                    audio_bytes,
                    gtts_result.get("mime_type", "audio/mpeg"),
                    provider="google-tts",
                )
            return gtts_result, 200

        # 3. Final Fallback to client-side browser synthesis if both server providers fail
        logger.error("All server-side TTS providers failed. Returning browser fallback.")
        return {
            "success": False,
            "provider": "browser",
            "error_type": "ALL_PROVIDERS_FAILED",
            "fallback_to_browser": True,
            "message": "Server-side speech synthesis unavailable. Browser speech synthesis will be used.",
        }, 200

    @classmethod
    def _synthesize_sarvam(cls, clean_text, language_code, api_key, base_url, model, speaker=None, pace=1.0):
        """Synthesize via Sarvam AI API."""
        try:
            # Sarvam per-call character limit ~500 chars
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

            timeout = current_app.config.get("AI_TIMEOUT_SECONDS", 30) if current_app else 30
            response = requests.post(endpoint, headers=headers, json=payload, timeout=timeout)

            if response.status_code == 200:
                result = response.json()
                audios = result.get("audios", [])
                if audios and len(audios) > 0:
                    raw_b64 = audios[0]
                    audio_bytes = base64.b64decode(raw_b64)
                    return {
                        "success": True,
                        "provider": "sarvam",
                        "model": model,
                        "language_code": language_code,
                        "speaker": chosen_speaker,
                        "audio_base64": raw_b64,
                        "audio_bytes": audio_bytes,
                        "mime_type": "audio/wav",
                    }

            logger.warning("Sarvam TTS returned HTTP %d: %s", response.status_code, response.text[:200])
            return {"success": False, "message": f"Sarvam error HTTP {response.status_code}"}

        except Exception as e:
            logger.warning("Sarvam TTS exception: %s", str(e))
            return {"success": False, "message": str(e)}

    @classmethod
    def _synthesize_gtts(cls, clean_text, language_code):
        """Synthesize speech using gTTS for regional Indian languages."""
        try:
            from gtts import gTTS

            # Map language code or fallback to 'en'
            gtts_lang = GTTS_LANG_MAP.get(language_code, "en")

            # Limit text for speech synthesis if extremely long (chunk up to 800 chars for smooth conversational speech)
            speech_text = clean_text[:800] if len(clean_text) > 800 else clean_text

            tts = gTTS(text=speech_text, lang=gtts_lang, slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            audio_bytes = buf.getvalue()

            if not audio_bytes or len(audio_bytes) < 100:
                return {"success": False, "message": "gTTS produced empty audio."}

            b64 = base64.b64encode(audio_bytes).decode("utf-8")
            return {
                "success": True,
                "provider": "google-tts",
                "language_code": language_code,
                "audio_base64": b64,
                "audio_bytes": audio_bytes,
                "mime_type": "audio/mpeg",
                "speaker": "natural",
            }
        except Exception as e:
            logger.exception("gTTS synthesis failed: %s", str(e))
            return {"success": False, "message": f"gTTS error: {str(e)}"}
