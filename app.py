"""
Smart Store - Main Application
==================================
Entry point for the Smart Store Flask backend.
Run this file to start the development server.

Usage:
    python app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import init_db
from routes.owner_routes import owner_bp
from routes.product_routes import product_bp


def create_app():
    """
    Application factory — creates and configures the Flask app.

    Returns:
        Flask: Configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (useful for frontend integration)
    CORS(app)

    # Register blueprints
    app.register_blueprint(owner_bp)
    app.register_blueprint(product_bp)

    # Root health-check route
    @app.route("/")
    def index():
        return jsonify({
            "success": True,
            "message": "Smart Store Backend Running"
        }), 200

    # Initialize database tables on startup
    init_db()

    return app


# Module-level app for gunicorn (Render cloud): gunicorn app:app
app = create_app()


if __name__ == "__main__":
    # Local development
    print("\n[SERVER] Smart Store Backend is running on http://0.0.0.0:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)

