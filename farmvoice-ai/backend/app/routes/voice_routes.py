"""FarmVoice AI - Dedicated Voice Routes Blueprint.

Provides endpoints for speech-to-text (transcribe), text-to-speech (speak),
language querying, and translation. Preserves standard REST response structures
and JWT authentication.
"""

import base64
import logging
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.speech_to_text_service import SpeechToTextService
from app.services.text_to_speech_service import TextToSpeechService
from app.services.language_service import LanguageService
from app.services.voice.translation_service import TranslationService

logger = logging.getLogger(__name__)

voice_bp = Blueprint("voice", __name__)

MAX_AUDIO_BYTES = 15 * 1024 * 1024  # 15 MB


@voice_bp.route("/transcribe", methods=["POST"])
@jwt_required()
def transcribe_audio():
    """Convert spoken farmer audio to text in their regional language."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": {"code": "UNAUTHORIZED", "message": "Invalid user identity."},
        }), 401

    audio_bytes = None
    filename = "recording.wav"
    content_type = "audio/wav"
    language_code = "kn"

    # Check for multipart file upload
    if "file" in request.files or "audio" in request.files:
        upload = request.files.get("file") or request.files.get("audio")
        audio_bytes = upload.read()
        filename = upload.filename or "recording.wav"
        content_type = upload.content_type or "audio/wav"
        language_code = request.form.get("language_code", "kn")
    else:
        # Check for JSON base64 payload
        data = request.get_json(silent=True) or {}
        b64 = data.get("audio")
        if b64:
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            try:
                audio_bytes = base64.b64decode(b64)
            except Exception:
                return jsonify({
                    "success": False,
                    "error": {"code": "INVALID_AUDIO", "message": "Invalid base64 audio data."},
                }), 400
        language_code = data.get("language_code", "kn")
        content_type = data.get("content_type", "audio/wav")

    if not audio_bytes:
        return jsonify({
            "success": False,
            "error": {"code": "NO_AUDIO_DATA", "message": "No audio recording was provided."},
        }), 400

    if len(audio_bytes) > MAX_AUDIO_BYTES:
        return jsonify({
            "success": False,
            "error": {"code": "AUDIO_TOO_LARGE", "message": "Audio file exceeds maximum size of 15MB."},
        }), 413

    result, status = SpeechToTextService.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=filename,
        language_code=language_code,
        content_type=content_type,
    )

    if status == 200 and result.get("success"):
        return jsonify({
            "success": True,
            "data": result,
            "message": "Audio transcribed successfully.",
        }), 200

    return jsonify({
        "success": False,
        "error": {
            "code": result.get("error_type", "TRANSCRIPTION_FAILED"),
            "message": result.get("message", "Voice recognition could not understand the recording. Please try again or type your question."),
        },
        "data": result,
    }), status


@voice_bp.route("/speak", methods=["POST"])
@jwt_required()
def speak_text():
    """Convert response text into natural regional spoken audio."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    language = data.get("language", "kn")
    speaker = data.get("speaker")
    pace = data.get("pace", 1.0)

    if not text:
        return jsonify({
            "success": False,
            "error": {"code": "MISSING_TEXT", "message": "Text is required for speech synthesis."},
        }), 400

    if len(text) > 3000:
        return jsonify({
            "success": False,
            "error": {"code": "TEXT_TOO_LONG", "message": "Text exceeds maximum length of 3000 characters."},
        }), 400

    result, status = TextToSpeechService.synthesize_speech(
        text=text,
        language_code=language,
        speaker=speaker,
        pace=pace,
    )

    if status == 200 and result.get("success"):
        return jsonify({
            "success": True,
            "data": result,
            "message": "Speech synthesized successfully.",
        }), 200

    return jsonify({
        "success": False,
        "error": {
            "code": result.get("error_type", "TTS_UNAVAILABLE"),
            "message": result.get("message", "Voice response is unavailable right now. You can still read the answer."),
        },
        "data": result,
    }), status


@voice_bp.route("/languages", methods=["GET"])
def get_voice_languages():
    """Return all supported voice languages and speech codes."""
    languages = LanguageService.get_supported_languages()
    return jsonify({
        "success": True,
        "data": {"languages": languages},
        "message": "Supported languages retrieved.",
    }), 200


@voice_bp.route("/translate", methods=["POST"])
@jwt_required()
def translate():
    """Translate agricultural text between languages when needed."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    target_lang = data.get("target_language") or data.get("target_lang", "en")
    source_lang = data.get("source_language") or data.get("source_lang")

    if not text:
        return jsonify({
            "success": False,
            "error": {"code": "MISSING_TEXT", "message": "Text is required for translation."},
        }), 400

    result, status = TranslationService.translate_text(
        text=text,
        target_lang=target_lang,
        source_lang=source_lang,
    )

    if status == 200 and result.get("success"):
        return jsonify({
            "success": True,
            "data": result,
            "message": "Translation completed successfully.",
        }), 200

    return jsonify({
        "success": False,
        "error": {
            "code": result.get("error_type", "TRANSLATION_FAILED"),
            "message": result.get("message", "Translation failed. Please try again."),
        },
        "data": result,
    }), status
