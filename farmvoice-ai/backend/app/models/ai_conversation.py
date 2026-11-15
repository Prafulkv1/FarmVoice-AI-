"""FarmVoice AI - AI Conversation model."""

from app import db


class AIConversation(db.Model):
    """Stores farmer chat sessions with the AI Assistant."""

    __tablename__ = "ai_conversations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.farmer_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False, default="New Farming Advisory")
    language = db.Column(db.String(10), nullable=False, default="en")
    dialect = db.Column(db.String(50), nullable=False, default="standard")
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relational connection to conversation messages
    messages = db.relationship(
        "AIMessage",
        backref="conversation",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="AIMessage.created_at.asc()",
    )

    def to_dict(self, include_messages=False):
        """Return a dictionary representation of the conversation."""
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "language": self.language,
            "dialect": self.dialect or "standard",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0,
        }
        if include_messages and self.messages:
            data["messages"] = [msg.to_dict() for msg in self.messages]
        elif self.messages:
            latest = self.messages[-1]
            data["latest_message"] = {
                "role": latest.role,
                "preview": (latest.message[:120] + "...") if len(latest.message) > 120 else latest.message,
                "created_at": latest.created_at.isoformat() if latest.created_at else None,
            }
        return data

    def __repr__(self):
        return f"<AIConversation id={self.id} user_id={self.user_id} title={self.title[:30]}>"
