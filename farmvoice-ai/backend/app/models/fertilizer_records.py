"""FarmVoice AI - Fertilizer records model."""

from app import db


class FertilizerRecord(db.Model):
    """Fertilizer records table: fertilizer application history."""

    __tablename__ = "fertilizer_records"

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
    fertilizer_name = db.Column(db.String(100), nullable=False)
    fertilizer_type = db.Column(db.String(50), nullable=False)
    quantity_used = db.Column(db.Numeric(10, 3), nullable=False)
    application_date = db.Column(db.Date, nullable=False)
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
        """Return a dictionary representation of the fertilizer record."""
        return {
            "record_id": self.record_id,
            "user_id": self.user_id,
            "crop_id": self.crop_id,
            "fertilizer_name": self.fertilizer_name,
            "fertilizer_type": self.fertilizer_type,
            "quantity_used": float(self.quantity_used)
            if self.quantity_used
            else None,
            "application_date": self.application_date.isoformat()
            if self.application_date
            else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FertilizerRecord {self.fertilizer_name} ({self.application_date})>"