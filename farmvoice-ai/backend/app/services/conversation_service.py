"""FarmVoice AI - Conversation Service.

Manages farmer chat histories, conversation sessions, message persistence,
and strict multi-tenant farmer data isolation.
"""

import logging
from datetime import datetime, timezone
from app import db
from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage
from app.services.language_service import LanguageService

logger = logging.getLogger(__name__)


class ConversationService:
    """Handles conversation lifecycle, message logging, and farmer isolation."""

    @staticmethod
    def create_conversation(user_id, title=None, language="en"):
        """Start a new AI conversation session for the authenticated farmer."""
        lang_code = LanguageService.normalize_language_code(language)
        conv_title = title.strip() if title and title.strip() else "New Farming Advisory"

        conv = AIConversation(
            user_id=user_id,
            title=conv_title[:250],
            language=lang_code,
        )

        try:
            db.session.add(conv)
            db.session.commit()
            return conv.to_dict(include_messages=False), 201
        except Exception as e:
            db.session.rollback()
            logger.error("Failed to create conversation for user %d: %s", user_id, e)
            return {"success": False, "message": "Failed to create conversation session."}, 500

    @staticmethod
    def list_conversations(user_id, limit=50, offset=0):
        """Retrieve recent conversations for the authenticated farmer only."""
        try:
            query = (
                AIConversation.query.filter_by(user_id=user_id)
                .order_by(AIConversation.updated_at.desc())
                .offset(offset)
                .limit(limit)
            )
            conversations = query.all()
            return {
                "success": True,
                "conversations": [c.to_dict(include_messages=False) for c in conversations],
                "count": len(conversations),
            }, 200
        except Exception as e:
            logger.error("Failed to list conversations for user %d: %s", user_id, e)
            return {"success": False, "message": "Failed to retrieve conversations."}, 500

    @staticmethod
    def get_conversation(user_id, conversation_id):
        """Fetch conversation details and messages, ensuring farmer data isolation."""
        try:
            conv = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
            if not conv:
                return {
                    "success": False,
                    "message": "Conversation not found or access denied.",
                }, 404

            return {
                "success": True,
                "conversation": conv.to_dict(include_messages=True),
            }, 200
        except Exception as e:
            logger.error("Error retrieving conversation %s for user %d: %s", conversation_id, user_id, e)
            return {"success": False, "message": "Failed to retrieve conversation."}, 500

    @staticmethod
    def delete_conversation(user_id, conversation_id):
        """Delete a conversation and all its messages for the authenticated farmer."""
        try:
            conv = AIConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
            if not conv:
                return {
                    "success": False,
                    "message": "Conversation not found or access denied.",
                }, 404

            db.session.delete(conv)
            db.session.commit()
            return {
                "success": True,
                "message": "Conversation deleted successfully.",
                "deleted_id": conversation_id,
            }, 200
        except Exception as e:
            db.session.rollback()
            logger.error("Failed to delete conversation %s for user %d: %s", conversation_id, user_id, e)
            return {"success": False, "message": "Failed to delete conversation."}, 500

    @staticmethod
    def add_message(conversation_id, role, message_text, language="en"):
        """Persist a message in the conversation and touch updated_at."""
        msg = AIMessage(
            conversation_id=conversation_id,
            role=role,
            message=message_text,
            language=language,
        )
        db.session.add(msg)

        # Update parent conversation timestamp
        conv = db.session.get(AIConversation, conversation_id)
        if conv:
            conv.updated_at = datetime.now(timezone.utc)
            # If default title, update title based on first user question
            if conv.title == "New Farming Advisory" and role == "user":
                clean_title = message_text.strip().replace("\n", " ")
                if len(clean_title) > 50:
                    clean_title = clean_title[:47] + "..."
                conv.title = clean_title

        db.session.commit()
        return msg.to_dict()
