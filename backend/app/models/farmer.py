"""FarmVoice AI - Farmer model."""

from app import db


class Farmer(db.Model):
    """Farmer table model representing registered farmers."""

    __tablename__ = "farmers"

    farmer_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_name = db.Column(db.String(150), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    mobile_number = db.Column(db.String(10), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )

    def to_dict(self, include_sensitive=False):
        """Return a dictionary representation of the farmer (never the hash)."""
        data = {
            "farmer_id": self.farmer_id,
            "farm_name": self.farm_name,
            "username": self.username,
            "email": self.email,
            "mobile_number": self.mobile_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        return data

    def __repr__(self):  # pragma: no cover - debug only
        return f"<Farmer {self.username}>"
