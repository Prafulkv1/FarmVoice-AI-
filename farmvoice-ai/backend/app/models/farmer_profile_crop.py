"""FarmVoice AI - Farmer profile crop model."""

from app import db


class FarmerProfileCrop(db.Model):
    """Farmer profile crop model: multiple crops per profile."""

    __tablename__ = "farmer_profile_crops"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    profile_id = db.Column(
        db.Integer,
        db.ForeignKey("farmer_profiles.profile_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )

    __table_args__ = (
        db.UniqueConstraint(
            "profile_id", "crop_name", name="uk_profile_id_crop_name"
        ),
    )

    def to_dict(self):
        """Return dictionary representation of a crop."""
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "crop_name": self.crop_name,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
        }

    def __repr__(self):  # pragma: no cover
        return f"<FarmerProfileCrop {self.crop_name} (profile_id={self.profile_id})>"
