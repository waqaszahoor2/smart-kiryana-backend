"""
Smart Store - Backend Package
==================================
Flask application factory and package definitions.
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from .config import Config
from .db import init_db
from .routes.owner_routes import owner_bp
from .routes.product_routes import product_bp
from .routes.auth_routes import auth_bp


def create_app():
    """
    Application factory - creates and configures the Flask app.

    Returns:
        Flask: Configured Flask application instance.
    """
    # Static folder is at the project root
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(root_dir, "static")
    
    app = Flask(__name__, static_folder=static_dir)
    app.config.from_object(Config)

    # Enable CORS for all routes (needed for frontend / mobile app)
    CORS(app, supports_credentials=True)

    # Register route blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(product_bp)

    # Serve the login page directly at root
    @app.route("/")
    def index():
        return send_from_directory(static_dir, "login.html")

    # Serve the dashboard directly at /dashboard
    @app.route("/dashboard")
    def dashboard():
        return send_from_directory(static_dir, "index.html")

    # Health-check endpoint (API)
    @app.route("/health")
    def health():
        return jsonify({
            "success": True,
            "message": "Smart Store Backend Running"
        }), 200

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "The requested resource was not found on this server."
        }), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "An internal server error occurred. Please check the logs."
        }), 500

    # Initialize database tables
    try:
        with app.app_context():
            init_db()
    except Exception as e:
        app.logger.error(f"Failed to initialize database: {e}")

    return app
