"""FarmVoice AI - Farmer profile service layer."""

import logging
from app import db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop

logger = logging.getLogger(__name__)

# Required profile fields for completion calculation
PROFILE_COMPLETION_FIELDS = [
    ("full_name", "Full Name", 10),
    ("mobile_number", "Mobile Number", 10),
    ("state", "State", 8),
    ("district", "District", 8),
    ("taluk", "Taluk", 8),
    ("village", "Village", 8),
    ("pin_code", "PIN Code", 8),
    ("total_land_size", "Total Land Size", 10),
    ("soil_type", "Soil Type", 10),
    ("irrigation_type", "Irrigation Type", 10),
    ("main_crops", "Main Crops", 10),
]


class ProfileService:
    """Business logic for fetching, creating, updating and calculating farmer profiles."""

    @staticmethod
    def get_profile(user_id):
        """Fetch the authenticated farmer's profile.

        Returns (response_dict, status_code).
        """
        farmer = db.session.get(Farmer, user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer account not found."},
                404,
            )

        farmer_data = farmer.to_dict()
        profile = FarmerProfile.query.filter_by(user_id=user_id).first()

        if not profile:
            return (
                {
                    "success": True,
                    "message": "Profile has not been created yet.",
                    "profile": None,
                    "farmer": farmer_data,
                    "email": farmer.email,
                    "is_complete": False,
                },
                200,
            )

        profile_data = profile.to_dict()
        profile_data["email"] = farmer.email
        profile_data["farmer"] = farmer_data

        return (
            {
                "success": True,
                "message": "Profile retrieved successfully.",
                "profile": profile_data,
                "farmer": farmer_data,
                "is_complete": True,
            },
            200,
        )

    @staticmethod
    def save_profile(user_id, data):
        """Create or update the authenticated farmer's profile using transactions.

        Returns (response_dict, status_code).
        """
        farmer = db.session.get(Farmer, user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer account not found."},
                404,
            )

        profile = FarmerProfile.query.filter_by(user_id=user_id).first()
        is_new = profile is None

        if is_new:
            profile = FarmerProfile(user_id=user_id)

        # Update profile fields
        profile.full_name = data["full_name"]
        profile.mobile_number = data["mobile_number"]
        profile.state = data["state"]
        profile.district = data["district"]
        profile.taluk = data["taluk"]
        profile.village = data["village"]
        profile.pin_code = data["pin_code"]
        profile.total_land_size = data["total_land_size"]
        profile.soil_type = data["soil_type"]
        profile.irrigation_type = data["irrigation_type"]
        profile.farming_experience = data["farming_experience"]
        profile.preferred_language = data["preferred_language"]
        profile.notifications_enabled = data["notifications_enabled"]

        # Keep mobile number in sync with user registration
        if data.get("mobile_number"):
            farmer.mobile_number = data["mobile_number"]

        try:
            db.session.add(profile)
            db.session.flush()  # Ensures profile.profile_id is available

            # Safely replace crop associations in the relational table
            FarmerProfileCrop.query.filter_by(
                profile_id=profile.profile_id
            ).delete()

            for crop_name in data["main_crops"]:
                db.session.add(
                    FarmerProfileCrop(
                        profile_id=profile.profile_id, crop_name=crop_name
                    )
                )

            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.error("Failed to save profile for user_id=%s: %s", user_id, exc)
            return (
                {
                    "success": False,
                    "message": "Database error: failed to save profile. Please try again.",
                },
                500,
            )

        result = profile.to_dict()
        result["email"] = farmer.email
        result["farmer"] = farmer.to_dict()

        message = (
            "Profile created successfully."
            if is_new
            else "Profile updated successfully."
        )
        status_code = 201 if is_new else 200

        return (
            {
                "success": True,
                "message": message,
                "profile": result,
                "farmer": farmer.to_dict(),
            },
            status_code,
        )

    @staticmethod
    def get_completion(user_id):
        """Calculate profile completion percentage and identify missing fields.

        Returns (response_dict, status_code).
        """
        farmer = db.session.get(Farmer, user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer account not found."},
                404,
            )

        profile = FarmerProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            missing = [f[1] for f in PROFILE_COMPLETION_FIELDS]
            return (
                {
                    "success": True,
                    "completion_percentage": 0,
                    "is_complete": False,
                    "missing_fields": missing,
                    "completed_fields": [],
                },
                200,
            )

        profile_data = profile.to_dict()
        total_weight = 0
        earned_weight = 0
        missing_fields = []
        completed_fields = []

        for key, label, weight in PROFILE_COMPLETION_FIELDS:
            total_weight += weight
            val = profile_data.get(key)
            has_val = False
            if key == "main_crops":
                has_val = isinstance(val, list) and len(val) > 0
            elif val is not None and str(val).strip() != "":
                has_val = True

            if has_val:
                earned_weight += weight
                completed_fields.append(label)
            else:
                missing_fields.append(label)

        percentage = round((earned_weight / total_weight) * 100) if total_weight else 0

        return (
            {
                "success": True,
                "completion_percentage": percentage,
                "is_complete": percentage == 100,
                "missing_fields": missing_fields,
                "completed_fields": completed_fields,
            },
            200,
        )
