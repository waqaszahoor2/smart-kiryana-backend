"""
Smart Store - Main Application
==================================
Flask application factory and entry point.
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

    # Enable CORS for all routes (needed for frontend / mobile app)
    CORS(app)

    # Register route blueprints
    app.register_blueprint(owner_bp)
    app.register_blueprint(product_bp)

    # Health-check endpoint
    @app.route("/")
    def index():
        return jsonify({
            "success": True,
            "message": "Smart Store Backend Running"
        }), 200

    # Initialize database tables on first request (serverless-safe)
    with app.app_context():
        init_db()

    return app


# Module-level app instance — used by Vercel (api/index.py) and local dev
app = create_app()


if __name__ == "__main__":
    print("\n[SERVER] Smart Store Backend running on http://0.0.0.0:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
