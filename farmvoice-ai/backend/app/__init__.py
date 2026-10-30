
"""FarmVoice AI - Flask application package."""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from app.config import Config

db = SQLAlchemy()
jwt = JWTManager()


def create_app(config_class=Config):
    """Application factory that creates and configures the Flask app."""

    app = Flask(__name__)
    app.config.from_object(config_class)

    # JWT cookie and CSRF configuration
    app.config.setdefault("JWT_TOKEN_LOCATION", ["cookies"])
    app.config.setdefault("JWT_COOKIE_CSRF_PROTECT", True)
    app.config.setdefault("JWT_CSRF_METHODS", ["POST", "PUT", "PATCH", "DELETE"])
    app.config.setdefault("JWT_ACCESS_CSRF_HEADER_NAME", "X-CSRF-TOKEN")
    app.config.setdefault("JWT_COOKIE_SECURE", False)  # Local development only
    app.config.setdefault("JWT_COOKIE_SAMESITE", "Lax")

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # Configure CORS
    CORS(
        app,
        resources={
    r"/api/*": {
        "origins": app.config["FRONTEND_URL"]
    }
},
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "X-CSRF-TOKEN",
            "Authorization"
        ],
        expose_headers=["X-CSRF-TOKEN"],
    )

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api")

    # Create database tables
    with app.app_context():
        db.create_all()

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Resource not found"
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

    return app
