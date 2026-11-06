"""FarmVoice AI - Farmer profile models.

Defines FarmerProfile and FarmerCrop models for storing extended farmer
information separate from the core Farmer (authentication) table.
"""

from app import db


class FarmerProfile(db.Model):
    """Extended farming profile for a registered farmer.

    One-to-one relationship with the farmers table via user_id.
    """

    __tablename__ = "farmer_profiles"

    profile_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.farmer_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    state = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    taluk = db.Column(db.String(100), nullable=False)
    village = db.Column(db.String(100), nullable=False)
    pin_code = db.Column(db.String(10), nullable=False)
    total_land_size = db.Column(db.Numeric(6, 2), nullable=False)
    soil_type = db.Column(db.String(50), nullable=False)
    irrigation_type = db.Column(db.String(50), nullable=False)
    farming_experience = db.Column(db.Integer, nullable=True)
    preferred_language = db.Column(db.String(50), nullable=False, default="English")
    notifications_enabled = db.Column(
        db.Boolean, nullable=False, default=True
    )
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationship to crops
    crops = db.relationship(
        "FarmerCrop",
        backref="profile",
        cascade="all, delete-orphan",
        lazy=True,
    )

    def to_dict(self):
        """Return a dictionary representation of the profile."""
        return {
            "profile_id": self.profile_id,
            "user_id": self.user_id,
            "state": self.state,
            "district": self.district,
            "taluk": self.taluk,
            "village": self.village,
            "pin_code": self.pin_code,
            "total_land_size": float(self.total_land_size) if self.total_land_size else None,
            "soil_type": self.soil_type,
            "irrigation_type": self.irrigation_type,
            "farming_experience": self.farming_experience,
            "preferred_language": self.preferred_language,
            "notifications_enabled": bool(self.notifications_enabled),
            "crops": [crop.crop_name for crop in self.crops],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FarmerProfile user_id={self.user_id}>"


class FarmerCrop(db.Model):
    """A crop grown by a farmer. Supports multiple crops per profile."""

    __tablename__ = "farmer_crops"

    crop_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    profile_id = db.Column(
        db.Integer,
        db.ForeignKey("farmer_profiles.profile_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
    )

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FarmerCrop {self.crop_name}>"