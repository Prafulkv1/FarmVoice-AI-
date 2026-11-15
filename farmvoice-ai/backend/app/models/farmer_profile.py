"""FarmVoice AI - Farmer profile model."""

from app import db
from app.models.farmer_profile_crop import FarmerProfileCrop


class FarmerProfile(db.Model):
    """Farmer profile table: one profile per registered farmer (user_id)."""

    __tablename__ = "farmer_profiles"

    profile_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.farmer_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    full_name = db.Column(db.String(150), nullable=False)
    mobile_number = db.Column(db.String(10), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    taluk = db.Column(db.String(100), nullable=False)
    village = db.Column(db.String(150), nullable=False)
    pin_code = db.Column(db.String(10), nullable=False)
    total_land_size = db.Column(db.Numeric(6, 2), nullable=False)
    land_unit = db.Column(db.String(20), nullable=False, default="Acres")
    soil_type = db.Column(db.String(50), nullable=False)
    irrigation_type = db.Column(db.String(50), nullable=False)
    farming_experience = db.Column(db.Integer, nullable=True)
    preferred_language = db.Column(
        db.String(50), nullable=False, default="English"
    )
    preferred_dialect = db.Column(
        db.String(50), nullable=False, default="standard"
    )
    voice_enabled = db.Column(
        db.Boolean, nullable=False, default=True
    )
    auto_play_voice = db.Column(
        db.Boolean, nullable=False, default=False
    )
    notifications_enabled = db.Column(
        db.Boolean, nullable=False, default=True
    )
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relational crops connection
    crops = db.relationship(
        "FarmerProfileCrop",
        backref="profile",
        cascade="all, delete-orphan",
        lazy="joined",
        order_by="FarmerProfileCrop.id",
    )

    @property
    def id(self):
        """Alias profile_id for standard id usage."""
        return self.profile_id

    def to_dict(self):
        """Return a dictionary representation of the profile."""
        crop_list = [c.crop_name for c in self.crops] if self.crops else []
        return {
            "id": self.profile_id,
            "profile_id": self.profile_id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "mobile_number": self.mobile_number,
            "state": self.state,
            "district": self.district,
            "taluk": self.taluk,
            "village": self.village,
            "pin_code": self.pin_code,
            "total_land_size": (
                float(self.total_land_size)
                if self.total_land_size is not None
                else None
            ),
            "land_unit": self.land_unit or "Acres",
            "soil_type": self.soil_type,
            "irrigation_type": self.irrigation_type,
            "farming_experience": self.farming_experience,
            "preferred_language": self.preferred_language,
            "preferred_dialect": self.preferred_dialect or "standard",
            "voice_enabled": bool(self.voice_enabled if self.voice_enabled is not None else True),
            "auto_play_voice": bool(self.auto_play_voice),
            "notifications_enabled": bool(self.notifications_enabled),
            "main_crops": crop_list,
            "crops": crop_list,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat() if self.updated_at else None
            ),
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FarmerProfile user_id={self.user_id}>"
