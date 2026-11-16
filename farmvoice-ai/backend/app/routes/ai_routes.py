"""FarmVoice AI - AI Assistant Routes (Flask Blueprint).

Exposes endpoints for context-aware multilingual chat, regional dialect adaptation,
speech-to-text (STT), text-to-speech (TTS), user voice preferences,
conversation management, language options, and service health.
"""

import base64
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.ai_conversation import AIConversation
from app.models.farmer_profile import FarmerProfile
from app.services.ai_service import AIService
from app.services.conversation_service import ConversationService
from app.services.farmer_context_service import FarmerContextService
from app.services.language_service import LanguageService
from app.services.language_detection_service import LanguageDetectionService
from app.services.dialect_adaptation_service import DialectAdaptationService
from app.services.speech_to_text_service import SpeechToTextService
from app.services.text_to_speech_service import TextToSpeechService
from app.services.scheme_service import SchemeService

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """Send a farming question and receive a context-grounded, dialect-adapted AI response."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    data = request.get_json(silent=True) or {}
    message_text = data.get("message", "").strip()

    if not message_text:
        return jsonify({"success": False, "message": "Please enter a valid question."}), 400

    if len(message_text) > 2000:
        return jsonify({"success": False, "message": "Question exceeds maximum length of 2000 characters."}), 400

    prof = FarmerProfile.query.filter_by(user_id=user_id).first()

    # 1. Language Resolution (Explicit override -> Auto Detection -> Profile Preference -> 'en')
    requested_lang = data.get("language")
    detected_info = None

    if requested_lang and requested_lang.lower() != "auto":
        language_code = LanguageService.normalize_language_code(requested_lang)
    else:
        # Detect language automatically from farmer's question text
        default_lang = prof.preferred_language if prof and prof.preferred_language else "en"
        detected_info = LanguageDetectionService.detect_language(message_text, default_lang=default_lang)
        language_code = detected_info["detected_language"]

    # 2. Dialect Resolution (Request -> Profile preference -> Conversation -> 'standard')
    requested_dialect = data.get("dialect")
    if not requested_dialect and prof and prof.preferred_dialect:
        requested_dialect = prof.preferred_dialect

    dialect_code = DialectAdaptationService.normalize_dialect(language_code, requested_dialect)

    # 3. Voice Mode Check
    voice_mode = data.get("voice_mode")
    if voice_mode is None and prof:
        voice_mode = bool(prof.voice_enabled)
    else:
        voice_mode = bool(voice_mode)

    # 4. Resolve or Create Conversation Session
    conversation_id = data.get("conversation_id")
    conv = None

    if conversation_id:
        conv = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
        if not conv:
            return jsonify({
                "success": False,
                "message": "Conversation not found or access denied.",
            }), 404
        # Update dialect if explicitly changed
        if conv.dialect != dialect_code:
            conv.dialect = dialect_code
            db.session.commit()
    else:
        # Auto-create new conversation
        conv_dict, status = ConversationService.create_conversation(
            user_id=user_id,
            title="New Farming Advisory",
            language=language_code,
            dialect=dialect_code,
        )
        if status != 201:
            return jsonify(conv_dict), status
        conversation_id = conv_dict["id"]

    # 5. Gather Authenticated Farmer Context
    context = FarmerContextService.get_farmer_context(user_id, question_text=message_text)
    context_str = FarmerContextService.format_context_for_prompt(context)

    # 6. Gather Prior Message History (up to last 6 turns)
    history = []
    if conv and conv.messages:
        for m in conv.messages[-6:]:
            history.append({"role": m.role, "message": m.message})

    # 7. Call AI Provider with Dialect Directives
    ai_result, ai_status = AIService.generate_response(
        question=message_text,
        context_str=context_str,
        language_code=language_code,
        dialect_code=dialect_code,
        conversation_history=history,
    )

    if ai_status != 200 or not ai_result.get("success"):
        return jsonify(ai_result), ai_status

    ai_text = ai_result["text"]

    # 8. Persist User and Assistant Messages
    user_msg = ConversationService.add_message(
        conversation_id=conversation_id,
        role="user",
        message_text=message_text,
        language=language_code,
    )

    assistant_msg = ConversationService.add_message(
        conversation_id=conversation_id,
        role="assistant",
        message_text=ai_text,
        language=language_code,
    )

    # 9. Audio Synthesis (Sarvam TTS or Google TTS if voice_mode enabled)
    audio_data = None
    if voice_mode:
        try:
            tts_res, tts_status = TextToSpeechService.synthesize_speech(
                text=ai_text,
                language_code=language_code,
                message_id=assistant_msg["id"],
            )
            if tts_status == 200 and tts_res.get("success"):
                audio_data = {
                    "provider": tts_res.get("provider", "google-tts"),
                    "audio_base64": tts_res.get("audio_base64"),
                    "audio_url": f"/api/ai/messages/{assistant_msg['id']}/audio",
                    "mime_type": tts_res.get("mime_type", "audio/mpeg"),
                    "speaker": tts_res.get("speaker"),
                }
        except Exception as tts_err:
            # Voice failure must never abort a valid AI written response
            pass

    # 10. Return Structured Response
    return jsonify({
        "success": True,
        "conversation_id": conversation_id,
        "role": "assistant",
        "message": ai_text,
        "language": language_code,
        "dialect": dialect_code,
        "detected_language": detected_info,
        "audio": audio_data,
        "user_message_id": user_msg["id"],
        "assistant_message_id": assistant_msg["id"],
        "created_at": assistant_msg["created_at"],
        "context_summary": {
            "farmer_name": context.get("farmer_name"),
            "crops": [c["crop_name"] for c in context.get("crops", [])],
            "soil_type": context.get("profile", {}).get("soil_type") if context.get("profile") else None,
            "weather": {
                "temperature": context.get("weather", {}).get("temperature") if context.get("weather") else None,
                "condition": context.get("weather", {}).get("condition") if context.get("weather") else None,
            } if context.get("weather") else None,
            "schemes_matched": len(context.get("relevant_schemes", [])),
        },
    }), 200


@ai_bp.route("/stt", methods=["POST"])
@jwt_required()
def speech_to_text():
    """Transcribe farmer spoken audio via Sarvam AI or return browser fallback."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    audio_bytes = None
    filename = "recording.wav"
    content_type = "audio/wav"
    language_code = "kn"

    # Check for multipart audio file upload
    if "file" in request.files or "audio" in request.files:
        upload = request.files.get("file") or request.files.get("audio")
        audio_bytes = upload.read()
        filename = upload.filename or "recording.wav"
        content_type = upload.content_type or "audio/wav"
        language_code = request.form.get("language_code", "kn")
    else:
        # Check JSON payload with base64
        data = request.get_json(silent=True) or {}
        b64 = data.get("audio")
        if b64:
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            try:
                audio_bytes = base64.b64decode(b64)
            except Exception:
                return jsonify({"success": False, "message": "Invalid base64 audio data."}), 400
        language_code = data.get("language_code", "kn")
        content_type = data.get("content_type", "audio/wav")

    if not audio_bytes:
        return jsonify({"success": False, "message": "No audio data provided."}), 400

    result, status = SpeechToTextService.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=filename,
        language_code=language_code,
        content_type=content_type,
    )
    return jsonify(result), status


@ai_bp.route("/tts", methods=["POST"])
@jwt_required()
def text_to_speech():
    """Synthesize text into natural regional speech."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    language = data.get("language", "kn")
    speaker = data.get("speaker")
    pace = data.get("pace", 1.0)

    if not text:
        return jsonify({"success": False, "message": "Text is required for TTS."}), 400

    result, status = TextToSpeechService.synthesize_speech(
        text=text,
        language_code=language,
        speaker=speaker,
        pace=pace,
    )
    return jsonify(result), status


@ai_bp.route("/messages/<int:message_id>/audio", methods=["GET"])
@jwt_required()
def get_message_audio(message_id):
    """Securely stream or return synthesized audio for a specific assistant message."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    from app.models.ai_message import AIMessage
    msg = AIMessage.query.filter_by(id=message_id).first()
    if not msg:
        return jsonify({"success": False, "message": "Message not found."}), 404

    conv = AIConversation.query.filter_by(id=msg.conversation_id).first()
    if not conv or conv.user_id != user_id:
        return jsonify({"success": False, "message": "Access denied. You do not own this audio."}), 403

    # Check cache first
    cached = TextToSpeechService.get_cached_audio(message_id)
    if cached:
        return Response(
            cached["audio_bytes"],
            mimetype=cached["mime_type"],
            headers={
                "Content-Disposition": f'inline; filename="farmvoice_msg_{message_id}.mp3"',
                "Accept-Ranges": "bytes",
                "Cache-Control": "private, max-age=3600",
            },
        )

    # Synthesize if not in cache
    tts_res, tts_status = TextToSpeechService.synthesize_speech(
        text=msg.message,
        language_code=msg.language or "kn",
        message_id=message_id,
    )
    if tts_status == 200 and tts_res.get("success") and "audio_bytes" in tts_res:
        return Response(
            tts_res["audio_bytes"],
            mimetype=tts_res.get("mime_type", "audio/mpeg"),
            headers={
                "Content-Disposition": f'inline; filename="farmvoice_msg_{message_id}.mp3"',
                "Accept-Ranges": "bytes",
                "Cache-Control": "private, max-age=3600",
            },
        )

    return jsonify({"success": False, "message": "Speech synthesis unavailable for this message."}), 502


@ai_bp.route("/dialects", methods=["GET"])
def get_dialects():
    """Return all supported regional dialects grouped by language."""
    dialects = DialectAdaptationService.get_all_dialects_grouped()
    return jsonify({"success": True, "dialects": dialects}), 200


@ai_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    """Retrieve authenticated farmer's language, dialect, and voice preferences."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    prof = FarmerProfile.query.filter_by(user_id=user_id).first()
    if not prof:
        return jsonify({
            "success": True,
            "preferences": {
                "preferred_language": "Kannada",
                "preferred_dialect": "standard",
                "voice_enabled": True,
                "auto_play_voice": True,
            },
        }), 200

    return jsonify({
        "success": True,
        "preferences": {
            "preferred_language": prof.preferred_language or "Kannada",
            "preferred_dialect": prof.preferred_dialect or "standard",
            "voice_enabled": bool(prof.voice_enabled if prof.voice_enabled is not None else True),
            "auto_play_voice": bool(prof.auto_play_voice if prof.auto_play_voice is not None else True),
        },
    }), 200


@ai_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    """Update authenticated farmer's language, dialect, and voice settings."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    data = request.get_json(silent=True) or {}
    prof = FarmerProfile.query.filter_by(user_id=user_id).first()
    if not prof:
        return jsonify({"success": False, "message": "Profile not found."}), 404

    if "preferred_language" in data:
        prof.preferred_language = str(data["preferred_language"]).strip()
    if "preferred_dialect" in data:
        prof.preferred_dialect = str(data["preferred_dialect"]).strip()
    if "voice_enabled" in data:
        prof.voice_enabled = bool(data["voice_enabled"])
    if "auto_play_voice" in data:
        prof.auto_play_voice = bool(data["auto_play_voice"])

    try:
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "AI voice and language preferences updated successfully.",
            "preferences": {
                "preferred_language": prof.preferred_language,
                "preferred_dialect": prof.preferred_dialect,
                "voice_enabled": prof.voice_enabled,
                "auto_play_voice": prof.auto_play_voice,
            },
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": "Failed to update preferences."}), 500


@ai_bp.route("/conversations", methods=["GET"])
@jwt_required()
def list_conversations():
    """List conversation sessions for the authenticated farmer."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)

    result, status = ConversationService.list_conversations(user_id, limit=limit, offset=offset)
    return jsonify(result), status


@ai_bp.route("/conversations/<int:conversation_id>", methods=["GET"])
@jwt_required()
def get_conversation(conversation_id):
    """Retrieve full conversation details and messages for the authenticated farmer."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    result, status = ConversationService.get_conversation(user_id, conversation_id)
    return jsonify(result), status


@ai_bp.route("/conversations", methods=["POST"])
@jwt_required()
def create_conversation():
    """Start an explicit new conversation session."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    data = request.get_json(silent=True) or {}
    title = data.get("title")
    language = data.get("language", "en")
    dialect = data.get("dialect", "standard")

    result, status = ConversationService.create_conversation(
        user_id, title=title, language=language, dialect=dialect
    )
    return jsonify(result), status


@ai_bp.route("/conversations/<int:conversation_id>", methods=["DELETE"])
@jwt_required()
def delete_conversation(conversation_id):
    """Delete a conversation session belonging to the authenticated farmer."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    result, status = ConversationService.delete_conversation(user_id, conversation_id)
    return jsonify(result), status


@ai_bp.route("/languages", methods=["GET"])
def get_languages():
    """Return the 9 supported regional languages with native names and speech codes."""
    languages = LanguageService.get_supported_languages()
    return jsonify({"success": True, "languages": languages}), 200


@ai_bp.route("/health", methods=["GET"])
def check_health():
    """Check AI service and voice operational status and configuration."""
    health_data = AIService.check_health()
    sarvam_configured = bool(request.environ.get("SARVAM_API_KEY") or AIService.get_config().get("api_key"))
    health_data["sarvam_configured"] = sarvam_configured
    status_code = 200 if health_data["configured"] else 503
    return jsonify({"success": True, "health": health_data}), status_code


@ai_bp.route("/schemes", methods=["GET"])
def get_schemes():
    """List verified government schemes."""
    schemes = SchemeService.get_all_schemes()
    return jsonify({"success": True, "schemes": schemes}), 200
