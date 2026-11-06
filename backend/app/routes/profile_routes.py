"""FarmVoice AI - Farmer profile routes (Flask blueprint).

Endpoints:
    GET  /api/profile  - Fetch the authenticated farmer's profile
    PUT  /api/profile  - Create or update the authenticated farmer's profile
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile, FarmerCrop
from app.utils.validators import validate_profile

profile_bp = Blueprint("profile", __name__)

# Valid lookup values
SOIL_TYPES = [
    "Alluvial", "Black", "Red", "Laterite", "Arid/Desert",
    "Forest/Mountain", "Saline/Alkaline", "Peaty",
]
IRRIGATION_TYPES = [
    "Rainfed", "Canal", "Tube well", "Well", "Drip",
    "Sprinkler", "Tank", "Other",
]
PREFERRED_LANGUAGES = [
    "Kannada", "Hindi", "Telugu", "Tamil", "Malayalam",
    "Marathi", "Bengali", "Punjabi", "English",
]


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Fetch the authenticated farmer's profile.

    Returns the profile if it exists, otherwise indicates the profile
    has not been completed yet. Includes basic farmer info from the
    users table (email is read-only).
    """
    user_id = int(get_jwt_identity())

    farmer = Farmer.query.get(user_id)
    if not farmer:
        return jsonify({
            "success": False,
            "message": "Farmer not found.",
        }), 404

    profile = FarmerProfile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({
            "success": True,
            "profile_completed": False,
            "message": "Profile not yet completed. Please fill in your details.",
            "farmer": farmer.to_dict(include_sensitive=False),
        }), 200

    return jsonify({
        "success": True,
        "profile_completed": True,
        "message": "Profile retrieved successfully.",
        "farmer": farmer.to_dict(include_sensitive=False),
        "profile": profile.to_dict(),
    }), 200


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def upsert_profile():
    """Create or update the authenticated farmer's profile.

    The user_id is always derived from the verified JWT - never from
    the request body. This prevents a farmer from accessing another
    farmer's profile.
    """
    user_id = int(get_jwt_identity())

    data = request.get_json(silent=True) or {}

    # Validate input
    errors = validate_profile(data)
    if errors:
        return jsonify({
            "success": False,
            "errors": errors,
            "message": "Validation failed.",
        }), 400

    # Verify the farmer exists
    farmer = Farmer.query.get(user_id)
    if not farmer:
        return jsonify({
            "success": False,
            "message": "Farmer not found.",
        }), 404

    try:
        # Extract crop names before upserting the profile
        crop_names = data.pop("main_crops", None)
        if crop_names is not None and not isinstance(crop_names, list):
            return jsonify({
                "success": False,
                "errors": {"main_crops": "Main crops must be a list."},
                "message": "Validation failed.",
            }), 400

        # Upsert the profile
        profile = FarmerProfile.query.filter_by(user_id=user_id).first()

        if profile:
            # Update existing profile
            profile.state = data["state"]
            profile.district = data["district"]
            profile.taluk = data["taluk"]
            profile.village = data["village"]
            profile.pin_code = data["pin_code"]
            profile.total_land_size = data["total_land_size"]
            profile.soil_type = data["soil_type"]
            profile.irrigation_type = data["irrigation_type"]
            profile.farming_experience = data.get("farming_experience")
            profile.preferred_language = data["preferred_language"]
            profile.notifications_enabled = data["notifications_enabled"]
        else:
            # Create new profile
            profile = FarmerProfile(
                user_id=user_id,
                state=data["state"],
                district=data["district"],
                taluk=data["taluk"],
                village=data["village"],
                pin_code=data["pin_code"],
                total_land_size=data["total_land_size"],
                soil_type=data["soil_type"],
                irrigation_type=data["irrigation_type"],
                farming_experience=data.get("farming_experience"),
                preferred_language=data["preferred_language"],
                notifications_enabled=data["notifications_enabled"],
            )
            db.session.add(profile)
            db.session.flush()  # Obtain profile_id before handling crops

        # Replace crops: delete existing and insert new ones
        if crop_names is not None:
            FarmerCrop.query.filter_by(profile_id=profile.profile_id).delete()
            for crop_name in crop_names:
                crop_name = crop_name.strip()
                if crop_name:
                    db.session.add(FarmerCrop(
                        profile_id=profile.profile_id,
                        crop_name=crop_name,
                    ))

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Profile saved successfully.",
            "profile": profile.to_dict(),
        }), 200

    except Exception as exc:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Failed to save profile. Please try again.",
        }), 500