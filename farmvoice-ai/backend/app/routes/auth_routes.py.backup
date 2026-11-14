
"""FarmVoice AI - Authentication routes (Flask blueprint)."""

from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)

from app.services.auth_service import AuthService
from app.utils.validators import validate_registration, validate_login

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new farmer."""
    data = request.get_json(silent=True) or {}

    errors, cleaned = validate_registration(data)

    if errors:
        return jsonify({
            "success": False,
            "errors": errors,
            "message": "Validation failed."
        }), 400

    response, status_code = AuthService.register(cleaned)

    return jsonify(response), status_code


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticate a farmer and issue an HttpOnly JWT cookie."""

    data = request.get_json(silent=True) or {}

    errors, cleaned = validate_login(data)

    if errors:
        return jsonify({
            "success": False,
            "errors": errors,
            "message": "Validation failed."
        }), 400

    response, status_code, token_info = AuthService.login(cleaned)

    if status_code != 200:
        return jsonify(response), status_code

    result = make_response(jsonify(response), 200)

    set_access_cookies(result, token_info["access_token"])

    return result


@auth_bp.route("/auth/profile", methods=["GET"])
@jwt_required()
def profile():
    """Return the authenticated farmer's profile."""

    farmer_id = int(get_jwt_identity())

    response, status_code = AuthService.profile(farmer_id)

    return jsonify(response), status_code


@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    """Clear authentication cookies and end the session."""

    response, status_code = AuthService.logout()

    result = make_response(jsonify(response), status_code)

    unset_jwt_cookies(result)

    return result
