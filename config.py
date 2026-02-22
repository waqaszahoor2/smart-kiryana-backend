"""
Smart Store - Configuration
=============================
Centralized configuration for database and application settings.
Supports both local development (MySQL) and Render cloud (PostgreSQL).
"""

import os


class Config:
    """Base configuration."""

    # Flask settings
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    SECRET_KEY = os.environ.get("SECRET_KEY", "smart-store-secret-key")

    # Database mode: 'mysql' for local, 'postgresql' for cloud (Render)
    DB_MODE = os.environ.get("DB_MODE", "mysql")

    # MySQL Database settings (local development)
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "Waqas@2262")
    DB_NAME = os.environ.get("DB_NAME", "smart_kiryana")

    # PostgreSQL Database URL (Render cloud)
    DATABASE_URL = os.environ.get("DATABASE_URL", "")
