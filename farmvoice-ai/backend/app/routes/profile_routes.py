"""FarmVoice AI - Farmer profile routes (Flask blueprint)."""

from flask import Blueprint, jsonify, request

from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.profile_service import ProfileService
from app.utils.profile_validators import validate_profile

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Fetch the authenticated farmer's profile."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid user identity."}), 401

    response, status_code = ProfileService.get_profile(user_id)
    return jsonify(response), status_code


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def save_profile():
    """Create or update the authenticated farmer's profile.

    The user_id is always taken from the verified JWT - never from the
    request body - so a farmer can never access another farmer's profile.
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

    response, status_code = ProfileService.save_profile(user_id, cleaned)
    return jsonify(response), status_code
