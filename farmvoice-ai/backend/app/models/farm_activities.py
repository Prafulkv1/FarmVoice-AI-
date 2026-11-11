"""FarmVoice AI - Farm activities model."""

from app import db


class FarmActivity(db.Model):
    """Farm activities table: daily farming activity records per farmer & crop."""

    __tablename__ = "farm_activities"

    activity_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.farmer_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_id = db.Column(
        db.Integer,
        db.ForeignKey("farmer_crops.crop_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activity_date = db.Column(db.Date, nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)
    activity_description = db.Column(db.Text, nullable=False)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=True,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    def to_dict(self):
        """Return a dictionary representation of the activity."""
        return {
            "activity_id": self.activity_id,
            "user_id": self.user_id,
            "crop_id": self.crop_id,
            "activity_date": self.activity_date.isoformat()
            if self.activity_date
            else None,
            "activity_type": self.activity_type,
            "activity_description": self.activity_description,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FarmActivity {self.activity_type} ({self.activity_date})>"