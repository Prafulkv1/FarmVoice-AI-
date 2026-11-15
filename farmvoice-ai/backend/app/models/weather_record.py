"""FarmVoice AI - Weather record model for persisting snapshots."""

from app import db


class WeatherRecord(db.Model):
    """Stores historical weather snapshots for farmers."""

    __tablename__ = "weather_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.farmer_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    location = db.Column(db.String(255), nullable=False)
    temperature = db.Column(db.Numeric(5, 2), nullable=False)
    humidity = db.Column(db.Integer, nullable=True)
    rainfall = db.Column(db.Numeric(6, 2), nullable=True, default=0.0)
    wind_speed = db.Column(db.Numeric(5, 2), nullable=True)
    weather_condition = db.Column(db.String(100), nullable=False)
    recorded_at = db.Column(
        db.DateTime, nullable=False, default=db.func.current_timestamp()
    )

    def to_dict(self):
        """Return dictionary representation of weather record."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "location": self.location,
            "temperature": (
                float(self.temperature) if self.temperature is not None else None
            ),
            "humidity": self.humidity,
            "rainfall": (
                float(self.rainfall) if self.rainfall is not None else 0.0
            ),
            "wind_speed": (
                float(self.wind_speed) if self.wind_speed is not None else None
            ),
            "weather_condition": self.weather_condition,
            "recorded_at": (
                self.recorded_at.isoformat() if self.recorded_at else None
            ),
        }

    def __repr__(self):
        return f"<WeatherRecord user_id={self.user_id} temp={self.temperature} condition={self.weather_condition}>"
