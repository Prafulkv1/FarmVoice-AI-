"""FarmVoice AI - Harvest records model."""

from app import db


class HarvestRecord(db.Model):
    """Harvest records table: harvesting information."""

    __tablename__ = "harvest_records"

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
    harvest_date = db.Column(db.Date, nullable=False)
    quantity_harvested = db.Column(db.Numeric(10, 3), nullable=False)
    quantity_unit = db.Column(db.String(20), nullable=False)
    quality_or_grade = db.Column(db.String(50), nullable=True)
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
        """Return a dictionary representation of the harvest record."""
        return {
            "record_id": self.record_id,
            "user_id": self.user_id,
            "crop_id": self.crop_id,
            "harvest_date": self.harvest_date.isoformat()
            if self.harvest_date
            else None,
            "quantity_harvested": float(self.quantity_harvested)
            if self.quantity_harvested
            else None,
            "quantity_unit": self.quantity_unit,
            "quality_or_grade": self.quality_or_grade,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<HarvestRecord {self.quantity_harvested} {self.quantity_unit} ({self.harvest_date})>"