"""FarmVoice AI - Pest management model."""

from app import db


class PestManagementRecord(db.Model):
    """Pest management records table: pesticide applications & pest observations."""

    __tablename__ = "pest_management_records"

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
    record_type = db.Column(
        db.String(30),
        nullable=False,
    )
    pesticide_name = db.Column(db.String(100), nullable=True)
    pest_or_disease_name = db.Column(db.String(100), nullable=False)
    application_or_observation_date = db.Column(db.Date, nullable=False)
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
        """Return a dictionary representation of the pest management record."""
        return {
            "record_id": self.record_id,
            "user_id": self.user_id,
            "crop_id": self.crop_id,
            "record_type": self.record_type,
            "pesticide_name": self.pesticide_name,
            "pest_or_disease_name": self.pest_or_disease_name,
            "application_or_observation_date": (
                self.application_or_observation_date.isoformat()
                if self.application_or_observation_date
                else None
            ),
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<PestManagementRecord {self.record_type} ({self.pest_or_disease_name})>"