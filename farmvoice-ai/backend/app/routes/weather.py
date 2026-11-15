"""FarmVoice AI - Weather Routes (Flask blueprint)."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.farmer import Farmer
from app.models.farmer_profile import FarmerProfile
from app.services.weather_service import WeatherService

weather_bp = Blueprint("weather", __name__)


def _get_authenticated_profile():
    """Extract authenticated farmer identity and load their profile."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, None, (jsonify({"success": False, "message": "Invalid user identity."}), 401)

    farmer = db.session.get(Farmer, user_id)
    if not farmer:
        return None, None, (jsonify({"success": False, "message": "Farmer account not found."}), 404)

    profile = FarmerProfile.query.filter_by(user_id=user_id).first()
    return user_id, profile, None


@weather_bp.route("/current", methods=["GET"])
@jwt_required()
def get_current_weather():
    """GET /api/weather/current

    Returns current weather observation for the authenticated farmer's location.
    """
    user_id, profile, err = _get_authenticated_profile()
    if err:
        return err

    force_refresh = request.args.get("refresh", "false").lower() in ("true", "1")
    data, status_code = WeatherService.get_all_weather(user_id, profile, force_refresh)
    if status_code != 200:
        return jsonify(data), status_code

    return jsonify({
        "success": True,
        "location": data["location"],
        "current": data["current"],
        "preferred_language": data["preferred_language"],
        "source": data["source"],
    }), 200


@weather_bp.route("/forecast", methods=["GET"])
@jwt_required()
def get_weather_forecast():
    """GET /api/weather/forecast

    Returns the seven-day forecast for the authenticated farmer's location.
    """
    user_id, profile, err = _get_authenticated_profile()
    if err:
        return err

    force_refresh = request.args.get("refresh", "false").lower() in ("true", "1")
    data, status_code = WeatherService.get_all_weather(user_id, profile, force_refresh)
    if status_code != 200:
        return jsonify(data), status_code

    return jsonify({
        "success": True,
        "location": data["location"],
        "daily_forecast": data["daily_forecast"],
        "source": data["source"],
    }), 200


@weather_bp.route("/hourly", methods=["GET"])
@jwt_required()
def get_weather_hourly():
    """GET /api/weather/hourly

    Returns hourly weather forecast for the current day.
    """
    user_id, profile, err = _get_authenticated_profile()
    if err:
        return err

    force_refresh = request.args.get("refresh", "false").lower() in ("true", "1")
    data, status_code = WeatherService.get_all_weather(user_id, profile, force_refresh)
    if status_code != 200:
        return jsonify(data), status_code

    return jsonify({
        "success": True,
        "location": data["location"],
        "hourly_forecast": data["hourly_forecast"],
        "source": data["source"],
    }), 200


@weather_bp.route("/alerts", methods=["GET"])
@jwt_required()
def get_weather_alerts():
    """GET /api/weather/alerts

    Returns available verified weather warnings or clear status notice.
    """
    user_id, profile, err = _get_authenticated_profile()
    if err:
        return err

    data, status_code = WeatherService.get_all_weather(user_id, profile, force_refresh=False)
    if status_code != 200:
        return jsonify(data), status_code

    return jsonify({
        "success": True,
        "location": data["location"],
        "alerts": data["alerts"],
        "source": data["source"],
    }), 200


@weather_bp.route("/history", methods=["GET"])
@jwt_required()
def get_weather_history():
    """GET /api/weather/history

    Returns saved historical weather snapshots from MySQL database.
    """
    user_id, profile, err = _get_authenticated_profile()
    if err:
        return err

    history = WeatherService.get_weather_history(user_id)
    return jsonify({
        "success": True,
        "history": history,
        "total_records": len(history),
    }), 200


@weather_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_weather_data():
    """GET /api/weather/all

    Unified endpoint returning current, 7-day forecast, hourly, rainfall,
    alerts, and agricultural advisories in a single call.
    """
    user_id, profile, err = _get_authenticated_profile()
    if err:
        return err

    force_refresh = request.args.get("refresh", "false").lower() in ("true", "1")
    data, status_code = WeatherService.get_all_weather(user_id, profile, force_refresh)
    return jsonify(data), status_code
