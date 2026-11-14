
"""FarmVoice AI - Authentication routes (Flask blueprint)."""

from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
    get_csrf_token,
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

    access_token = token_info["access_token"]

    set_access_cookies(result, access_token)

    # Obtain the CSRF token from the generated JWT.
    csrf_token = get_csrf_token(access_token)

    # Expose the CSRF token in a readable response cookie.
    # This preserves the double-submit CSRF protection pattern.
    from flask import current_app

    csrf_cookie_name = current_app.config.get(
        "JWT_ACCESS_CSRF_COOKIE_NAME",
        "csrf_access_token"
    )

    result.set_cookie(
        csrf_cookie_name,
        csrf_token,
        httponly=False,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite=current_app.config.get("JWT_COOKIE_SAMESITE", "Lax"),
        path=current_app.config.get("JWT_ACCESS_CSRF_COOKIE_PATH", "/")
    )

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
