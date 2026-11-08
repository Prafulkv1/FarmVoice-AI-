"""FarmVoice AI - Farmer profile service layer."""

from app import db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.models.farmer_crop import FarmerCrop


class ProfileService:
    """Business logic for fetching and saving farmer profiles."""

    @staticmethod
    def get_profile(user_id):
        """Fetch the authenticated farmer's profile with account email.

        Returns (response_dict, status_code).
        """
        farmer = Farmer.query.get(user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer not found."},
                404,
            )

        profile = FarmerProfile.query.filter_by(user_id=user_id).first()
        farmer_data = farmer.to_dict()
        if not profile:
            return (
                {
                    "success": True,
                    "message": "Profile has not been completed yet.",
                    "profile": None,
                    "farmer": farmer_data,
                    "email": farmer.email,
                },
                200,
            )

        profile_data = profile.to_dict()
        profile_data["main_crops"] = [
            c.crop_name
            for c in FarmerCrop.query.filter_by(user_id=user_id).order_by(
                FarmerCrop.crop_id
            ).all()
        ]
        profile_data["email"] = farmer.email
        profile_data["farmer"] = farmer_data
        return (
            {
                "success": True,
                "message": "Profile fetched successfully.",
                "profile": profile_data,
            },
            200,
        )

    @staticmethod
    def save_profile(user_id, data):
        """Create or update the authenticated farmer's profile.

        Returns (response_dict, status_code).
        """
        farmer = Farmer.query.get(user_id)
        if not farmer:
            return (
                {"success": False, "message": "Farmer not found."},
                404,
            )

        profile = FarmerProfile.query.filter_by(user_id=user_id).first()
        is_new = profile is None
        if is_new:
            profile = FarmerProfile(user_id=user_id)

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

        try:
            db.session.add(profile)
            db.session.flush()

            # Replace the crop selection (normalized many-to-one via user_id)
            FarmerCrop.query.filter_by(user_id=user_id).delete()
            for crop_name in data["main_crops"]:
                db.session.add(
                    FarmerCrop(user_id=user_id, crop_name=crop_name)
                )

            db.session.commit()
        except Exception:
            db.session.rollback()
            return (
                {"success": False, "message": "Failed to save profile. Please try again."},
                500,
            )

        profile_result = profile.to_dict()
        profile_result["main_crops"] = [
            c.crop_name
            for c in FarmerCrop.query.filter_by(user_id=user_id).order_by(
                FarmerCrop.crop_id
            ).all()
        ]
        profile_result["email"] = farmer.email
        message = (
            "Profile created successfully."
            if is_new
            else "Profile updated successfully."
        )
        return (
            {
                "success": True,
                "message": message,
                "profile": profile_result,
            },
            200,
        )
