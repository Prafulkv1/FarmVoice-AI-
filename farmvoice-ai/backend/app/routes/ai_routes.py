"""FarmVoice AI - AI Assistant Routes (Flask Blueprint).

Exposes endpoints for context-aware multilingual chat, conversation
management, language options, verified schemes, and service health.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.ai_conversation import AIConversation
from app.models.farmer_profile import FarmerProfile
from app.services.ai_service import AIService
from app.services.conversation_service import ConversationService
from app.services.farmer_context_service import FarmerContextService
from app.services.language_service import LanguageService
from app.services.scheme_service import SchemeService

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """Send a farming question and receive a context-grounded AI response."""
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

    # Determine language preference
    lang_param = data.get("language")
    if not lang_param:
        # Check farmer profile preference
        prof = FarmerProfile.query.filter_by(user_id=user_id).first()
        if prof and prof.preferred_language:
            lang_param = prof.preferred_language
        else:
            lang_param = "en"

    language_code = LanguageService.normalize_language_code(lang_param)

    # Resolve or create conversation session
    conversation_id = data.get("conversation_id")
    conv = None

    if conversation_id:
        conv = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
        if not conv:
            return jsonify({
                "success": False,
                "message": "Conversation not found or access denied.",
            }), 404
    else:
        # Auto-create new conversation
        conv_dict, status = ConversationService.create_conversation(
            user_id=user_id,
            title="New Farming Advisory",
            language=language_code,
        )
        if status != 201:
            return jsonify(conv_dict), status
        conversation_id = conv_dict["id"]

    # Gather authenticated farmer context
    context = FarmerContextService.get_farmer_context(user_id, question_text=message_text)
    context_str = FarmerContextService.format_context_for_prompt(context)

    # Gather prior message history (up to last 6 turns)
    history = []
    if conv and conv.messages:
        for m in conv.messages[-6:]:
            history.append({"role": m.role, "message": m.message})

    # Call AI Provider
    ai_result, ai_status = AIService.generate_response(
        question=message_text,
        context_str=context_str,
        language_code=language_code,
        conversation_history=history,
    )

    if ai_status != 200 or not ai_result.get("success"):
        return jsonify(ai_result), ai_status

    ai_text = ai_result["text"]

    # Persist both user and assistant messages
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

    # Return structured response
    return jsonify({
        "success": True,
        "conversation_id": conversation_id,
        "role": "assistant",
        "message": ai_text,
        "language": language_code,
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

    result, status = ConversationService.create_conversation(user_id, title=title, language=language)
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
    """Check AI service operational status and configuration."""
    health_data = AIService.check_health()
    status_code = 200 if health_data["configured"] else 503
    return jsonify({"success": True, "health": health_data}), status_code


@ai_bp.route("/schemes", methods=["GET"])
def get_schemes():
    """List verified government schemes."""
    schemes = SchemeService.get_all_schemes()
    return jsonify({"success": True, "schemes": schemes}), 200
