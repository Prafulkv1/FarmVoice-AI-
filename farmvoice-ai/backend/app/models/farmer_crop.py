"""FarmVoice AI - Farmer crop model."""

from app import db


class FarmerCrop(db.Model):
    """Farmer crops table: normalized multi-crop selection per farmer."""

    __tablename__ = "farmer_crops"

    crop_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.farmer_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "crop_name", name="uk_user_id_crop_name"),
    )

    def to_dict(self):
        """Return a dictionary representation of the crop."""
        return {
            "crop_id": self.crop_id,
            "user_id": self.user_id,
            "crop_name": self.crop_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FarmerCrop {self.crop_name} (user_id={self.user_id})>"
