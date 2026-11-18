"""FarmVoice AI - Voice Services Package.

Exposes regional STT, TTS, language detection, and translation services.
Re-exports core services for clean modular imports while preserving
backward compatibility with existing imports in other modules.
"""

from app.services.speech_to_text_service import SpeechToTextService
from app.services.text_to_speech_service import TextToSpeechService
from app.services.language_detection_service import LanguageDetectionService
from app.services.voice.translation_service import TranslationService

__all__ = [
    "SpeechToTextService",
    "TextToSpeechService",
    "LanguageDetectionService",
    "TranslationService",
]
