"""FarmVoice AI - Irrigation records model."""

from app import db


class IrrigationRecord(db.Model):
    """Irrigation records table: irrigation history."""

    __tablename__ = "irrigation_records"

    record_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
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
    irrigation_date = db.Column(db.Date, nullable=False)
    irrigation_method = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.String(50), nullable=False)
    water_usage = db.Column(db.Numeric(10, 3), nullable=True)
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
        """Return a dictionary representation of the irrigation record."""
        return {
            "record_id": self.record_id,
            "user_id": self.user_id,
            "crop_id": self.crop_id,
            "irrigation_date": self.irrigation_date.isoformat()
            if self.irrigation_date
            else None,
            "irrigation_method": self.irrigation_method,
            "duration": self.duration,
            "water_usage": float(self.water_usage) if self.water_usage else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<IrrigationRecord {self.irrigation_method} ({self.irrigation_date})>"