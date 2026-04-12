"""
Smart Store - Main Application
==================================
Flask application factory and entry point.
Serves both the REST API and the web dashboard.
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from db import init_db
from routes.owner_routes import owner_bp
from routes.product_routes import product_bp
from routes.auth_routes import auth_bp
import os


def create_app():
    """
    Application factory — creates and configures the Flask app.

    Returns:
        Flask: Configured Flask application instance.
    """
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    app = Flask(__name__, static_folder=static_dir)
    app.config.from_object(Config)

    # Enable CORS for all routes (needed for frontend / mobile app)
    CORS(app, supports_credentials=True)

    # Register route blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(product_bp)

    # Serve the login page
    @app.route("/")
    def index():
        return send_from_directory(static_dir, "login.html")

    # Serve the dashboard (after login)
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

    # Initialize database tables
    with app.app_context():
        init_db()

    return app


# Module-level app instance — used by Vercel (api/index.py) and local dev
app = create_app()


if __name__ == "__main__":
    print("\n[SERVER] Smart Store Backend running on http://127.0.0.1:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
