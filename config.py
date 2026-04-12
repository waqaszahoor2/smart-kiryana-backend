"""
Smart Store - Configuration
=============================
Centralized configuration for database and application settings.
Uses PostgreSQL via DATABASE_URL environment variable (Vercel / Cloud).
Falls back to local MySQL for development when DATABASE_URL is not set.
"""

import os


class Config:
    """Base configuration."""

    # Flask settings
    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    SECRET_KEY = os.environ.get("SECRET_KEY", "smart-store-secret-key")

    # Database URL (PostgreSQL) — set this in Vercel environment variables
    # Example: postgres://user:password@host:5432/dbname
    DATABASE_URL = os.environ.get("DATABASE_URL", "")

    # Database mode: auto-detect from DATABASE_URL presence
    DB_MODE = "postgresql" if DATABASE_URL else "mysql"

    # MySQL Database settings (local development fallback)
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "Waqas@2262")
    DB_NAME = os.environ.get("DB_NAME", "smart_kiryana")
