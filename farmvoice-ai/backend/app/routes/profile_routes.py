"""FarmVoice AI - Farmer profile routes (Flask blueprint)."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.profile_service import ProfileService
from app.utils.profile_validators import validate_profile

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Fetch the authenticated farmer's profile.

    Returns registered personal information, saved profile information if available,
    an appropriate empty state if no profile exists, and the actual profile completion percentage.
    """
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    response, status_code = ProfileService.get_profile(user_id)
    return jsonify(response), status_code


@profile_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_profile():
    """Create a profile for the authenticated farmer.

    Validates incoming information, saves the profile to MySQL,
    and prevents duplicate profile creation.
    """
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    data = request.get_json(silent=True) or {}
    errors, cleaned = validate_profile(data)
    if errors:
        return jsonify({
            "success": False,
            "errors": errors,
            "message": "Validation failed.",
        }), 400

    response, status_code = ProfileService.create_profile(user_id, cleaned)
    return jsonify(response), status_code


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update the existing authenticated farmer's profile.

    Updates the existing database record without inserting duplicate records.
    The user_id is extracted directly from the verified JWT - never from the request payload.
    """
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    data = request.get_json(silent=True) or {}
    errors, cleaned = validate_profile(data)
    if errors:
        return jsonify({
            "success": False,
            "errors": errors,
            "message": "Validation failed.",
        }), 400

    response, status_code = ProfileService.update_profile(user_id, cleaned)
    return jsonify(response), status_code


@profile_bp.route("/profile/completion", methods=["GET"])
@jwt_required()
def get_profile_completion():
    """Return the profile completion percentage and missing fields based on saved data."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    response, status_code = ProfileService.get_completion(user_id)
    return jsonify(response), status_code
