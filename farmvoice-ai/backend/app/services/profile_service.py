"""FarmVoice AI - Farmer profile service layer."""

import logging
from decimal import Decimal
from app import db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_profile_crop import FarmerProfileCrop
from app.utils.profile_validators import (
    SOIL_TYPES,
    IRRIGATION_TYPES,
    PREFERRED_LANGUAGES,
    LAND_UNITS,
    MOBILE_REGEX,
    PIN_CODE_REGEX,
)

logger = logging.getLogger(__name__)

# Field definitions with weights matching:
# Personal: 20% (full_name: 7%, mobile_number: 7%, email: 6%)
# Location: 25% (state: 5%, district: 5%, taluk: 5%, village: 5%, pin_code: 5%)
# Farming: 40% (total_land_size: 10%, soil_type: 10%, irrigation_type: 10%, farming_experience: 5%, main_crops: 5%)
# Preferences: 15% (preferred_language: 10%, notifications_enabled: 5%)
# Total = 100%
PROFILE_FIELD_CONFIG = [
    ("full_name", "Full Name", "personal", 7),
    ("mobile_number", "Mobile Number", "personal", 7),
    ("email", "Email Address", "personal", 6),
    ("state", "State", "location", 5),
    ("district", "District", "location", 5),
    ("taluk", "Taluk", "location", 5),
    ("village", "Village", "location", 5),
    ("pin_code", "PIN Code", "location", 5),
    ("total_land_size", "Total Land Size", "farming", 10),
    ("soil_type", "Soil Type", "farming", 10),
    ("irrigation_type", "Irrigation Type", "farming", 10),
    ("farming_experience", "Farming Experience", "farming", 5),
    ("main_crops", "Main Crops", "farming", 5),
    ("preferred_language", "Preferred Language", "preferences", 10),
    ("notifications_enabled", "Notification Preference", "preferences", 5),
]

REQUIRED_PROFILE_FIELDS = [(item[0], item[1]) for item in PROFILE_FIELD_CONFIG]


def is_field_completed(key, val):
    """Check whether a field has a valid, meaningful value (not placeholder/empty)."""
    if val is None:
        return False

    if key in ("full_name", "state", "district", "taluk", "village"):
        text = str(val).strip()
        return bool(text and text.lower() not in ("not added yet", "not provided"))

    if key == "email":
        text = str(val).strip()
        return bool(text and "@" in text)

    if key == "mobile_number":
        text = str(val).strip()
        return bool(MOBILE_REGEX.match(text))

    if key == "pin_code":
        text = str(val).strip()
        return bool(PIN_CODE_REGEX.match(text))

    if key == "total_land_size":
        try:
            return float(val) > 0
        except (ValueError, TypeError):
            return False

    if key == "soil_type":
        return str(val).strip() in SOIL_TYPES

    if key == "irrigation_type":
        return str(val).strip() in IRRIGATION_TYPES

    if key == "main_crops":
        return isinstance(val, (list, tuple)) and len(val) > 0

    if key == "farming_experience":
        try:
            exp = int(str(val).strip())
            return 0 <= exp <= 100
        except (ValueError, TypeError):
            return False

    if key == "preferred_language":
        return str(val).strip() in PREFERRED_LANGUAGES

    if key == "notifications_enabled":
        return isinstance(val, bool)

    return False


def calculate_profile_metrics(data_source):
    """Calculate dynamic profile completion metrics based on saved data."""
    completed_fields = []
    missing_fields = []
    category_scores = {
        "personal": {"score": 0, "max": 20},
        "location": {"score": 0, "max": 25},
        "farming": {"score": 0, "max": 40},
        "preferences": {"score": 0, "max": 15},
    }

    total_score = 0

    for key, label, category, weight in PROFILE_FIELD_CONFIG:
        val = data_source.get(key)
        if is_field_completed(key, val):
            completed_fields.append(label)
            category_scores[category]["score"] += weight
            total_score += weight
        else:
            missing_fields.append(label)

    # Ensure percentage stays strictly within 0 - 100
    percentage = max(0, min(100, round(total_score)))
    total_count = len(PROFILE_FIELD_CONFIG)  # 15
    completed_count = len(completed_fields)
    remaining_count = len(missing_fields)

    return {
        "completion_percentage": percentage,
        "completed_count": completed_count,
        "total_fields": total_count,
        "remaining_count": remaining_count,
        "completed_fields": completed_fields,
        "missing_fields": missing_fields,
        "category_scores": category_scores,
        "is_complete": percentage == 100,
    }


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

        data_source = {}
        if profile:
            data_source = profile.to_dict()
        data_source["email"] = farmer.email
        if not data_source.get("full_name"):
            data_source["full_name"] = farmer.farm_name
        if not data_source.get("mobile_number"):
            data_source["mobile_number"] = farmer.mobile_number

        metrics = calculate_profile_metrics(data_source)

        if not profile:
            return (
                {
                    "success": True,
                    "message": "Profile has not been created yet.",
                    "profile": None,
                    "farmer": farmer_data,
                    "email": farmer.email,
                    "is_complete": False,
                    "completion": metrics,
                    "completion_percentage": metrics["completion_percentage"],
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
                "email": farmer.email,
                "is_complete": metrics["is_complete"],
                "completion": metrics,
                "completion_percentage": metrics["completion_percentage"],
            },
            200,
        )

    @staticmethod
    def create_profile(user_id, data):
        """Create a profile for the authenticated farmer.

        Strictly prevents duplicate profile creation.
        Returns (response_dict, status_code).
        """
        farmer = db.session.get(Farmer, user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer account not found."},
                404,
            )

        existing = FarmerProfile.query.filter_by(user_id=user_id).first()
        if existing:
            return (
                {
                    "success": False,
                    "message": "Profile already exists for this farmer. Use PUT to update your profile.",
                },
                409,
            )

        profile = FarmerProfile(user_id=user_id)
        return ProfileService._apply_and_save(farmer, profile, data, is_new=True)

    @staticmethod
    def update_profile(user_id, data):
        """Update the existing authenticated farmer's profile.

        Updates the existing record instead of creating a duplicate.
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
            # Safe fallback if PUT called before initial POST
            profile = FarmerProfile(user_id=user_id)

        return ProfileService._apply_and_save(farmer, profile, data, is_new=is_new)

    @staticmethod
    def _apply_and_save(farmer, profile, data, is_new=False):
        """Internal helper to populate, persist and return profile with transaction."""
        profile.full_name = data["full_name"]
        profile.mobile_number = data["mobile_number"]
        profile.state = data["state"]
        profile.district = data["district"]
        profile.taluk = data["taluk"]
        profile.village = data["village"]
        profile.pin_code = data["pin_code"]
        profile.total_land_size = data["total_land_size"]
        profile.land_unit = data.get("land_unit") or "Acres"
        profile.soil_type = data["soil_type"]
        profile.irrigation_type = data["irrigation_type"]
        profile.farming_experience = data["farming_experience"]
        profile.preferred_language = data["preferred_language"]
        if "preferred_dialect" in data and data["preferred_dialect"]:
            profile.preferred_dialect = data["preferred_dialect"]
        if "voice_enabled" in data and data["voice_enabled"] is not None:
            profile.voice_enabled = bool(data["voice_enabled"])
        if "auto_play_voice" in data and data["auto_play_voice"] is not None:
            profile.auto_play_voice = bool(data["auto_play_voice"])
        profile.notifications_enabled = data["notifications_enabled"]

        # Keep farmer registration model in sync with latest personal details
        if data.get("full_name"):
            farmer.farm_name = data["full_name"]
        if data.get("mobile_number"):
            farmer.mobile_number = data["mobile_number"]

        try:
            db.session.add(profile)
            db.session.flush()  # Ensure profile_id is populated

            # Reconcile crops collection without delete-insert conflicts
            current_crops = {c.crop_name: c for c in profile.crops}
            new_crop_names = set(data.get("main_crops", []))

            # 1. Remove crops that the farmer deselected
            for name, crop_obj in list(current_crops.items()):
                if name not in new_crop_names:
                    profile.crops.remove(crop_obj)

            # 2. Add newly selected crops
            for name in data.get("main_crops", []):
                if name not in current_crops:
                    profile.crops.append(
                        FarmerProfileCrop(
                            profile_id=profile.profile_id, crop_name=name
                        )
                    )

            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.error("Failed to save profile for user_id=%s: %s", farmer.farmer_id, exc)
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

        data_source = dict(result)
        data_source["email"] = farmer.email
        metrics = calculate_profile_metrics(data_source)

        message = (
            "Your farmer profile has been saved successfully!"
            if is_new
            else "Your farmer profile has been updated successfully!"
        )
        status_code = 201 if is_new else 200

        return (
            {
                "success": True,
                "message": message,
                "profile": result,
                "farmer": farmer.to_dict(),
                "completion": metrics,
                "completion_percentage": metrics["completion_percentage"],
            },
            status_code,
        )

    # Alias for backwards compatibility
    save_profile = update_profile

    @staticmethod
    def get_completion(user_id):
        """Calculate profile completion percentage and missing fields."""
        farmer = db.session.get(Farmer, user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer account not found."},
                404,
            )

        profile = FarmerProfile.query.filter_by(user_id=user_id).first()

        data_source = {}
        if profile:
            data_source = profile.to_dict()
        data_source["email"] = farmer.email
        if not data_source.get("full_name"):
            data_source["full_name"] = farmer.farm_name
        if not data_source.get("mobile_number"):
            data_source["mobile_number"] = farmer.mobile_number

        metrics = calculate_profile_metrics(data_source)

        return (
            {
                "success": True,
                "completion_percentage": metrics["completion_percentage"],
                "completed_count": metrics["completed_count"],
                "total_fields": metrics["total_fields"],
                "remaining_count": metrics["remaining_count"],
                "completed_fields": metrics["completed_fields"],
                "missing_fields": metrics["missing_fields"],
                "category_scores": metrics["category_scores"],
                "is_complete": metrics["is_complete"],
            },
            200,
        )
