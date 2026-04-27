"""
Smart Store - Backend Package
==================================
Flask application factory and package definitions.
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from .config import Config
from .routes.data_routes import data_bp

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

    # Register route blueprints
    app.register_blueprint(data_bp)

    # Health-check endpoint (API)
    @app.route("/health")
    def health():
        return jsonify({
            "success": True,
            "message": "Smart Store Backend Running"
        }), 200

    # Global Error Handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the error
        import logging
        logging.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        
        return jsonify({
            "success": False,
            "message": "An internal server error occurred",
            "error": str(e)
        }), 500

    return app
