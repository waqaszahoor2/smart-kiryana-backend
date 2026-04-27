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
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (needed for frontend)
    CORS(app)

    # Initialize database tables
    with app.app_context():
        init_db()

    # Register route blueprints
    app.register_blueprint(owner_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(auth_bp)

    # Health-check endpoint (API)
    @app.route("/health")
    def health():
        return jsonify({
            "success": True,
            "message": "Smart Store Backend Running"
        }), 200

    # Static file serving (for web dashboard)
    @app.route("/")
    def serve_index():
        return send_from_directory("../static", "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        # Serve from static folder if file exists, otherwise serve index.html (for SPA)
        if os.path.exists(os.path.join(app.root_path, "../static", path)):
            return send_from_directory("../static", path)
        return send_from_directory("../static", "index.html")

    return app
