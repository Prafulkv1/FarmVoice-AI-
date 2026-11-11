"""FarmVoice AI - Farm expenses model."""

from app import db


class FarmExpense(db.Model):
    """Farm expenses table: farming expense records."""

    __tablename__ = "farm_expenses"

    expense_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
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
    expense_category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(300), nullable=False)
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
        """Return a dictionary representation of the farm expense."""
        return {
            "expense_id": self.expense_id,
            "user_id": self.user_id,
            "crop_id": self.crop_id,
            "expense_category": self.expense_category,
            "amount": float(self.amount) if self.amount else None,
            "expense_date": self.expense_date.isoformat()
            if self.expense_date
            else None,
            "description": self.description,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
        }

    def __repr__(self):  # pragma: no cover - debug only
        return f"<FarmExpense {self.expense_category} ({self.expense_date})>"