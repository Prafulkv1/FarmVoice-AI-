"""FarmVoice AI - AI Message model."""

from app import db


class AIMessage(db.Model):
    """Stores individual messages within an AI conversation."""

    __tablename__ = "ai_messages"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey("ai_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    message = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(10), nullable=True, default="en")
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )

    def to_dict(self):
        """Return a dictionary representation of the message."""
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "message": self.message,
            "language": self.language,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<AIMessage id={self.id} conv={self.conversation_id} role={self.role}>"
