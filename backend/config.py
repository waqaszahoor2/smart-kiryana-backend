import os

class Config:
    """Base configuration for Cloud Run and Vercel."""
    
    # Flask settings
    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    SECRET_KEY = os.environ.get("SECRET_KEY", "smart-store-fallback-key")
    
    # Firebase configuration
    FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID")
    FIREBASE_CLIENT_EMAIL = os.environ.get("FIREBASE_CLIENT_EMAIL")
    FIREBASE_PRIVATE_KEY = os.environ.get("FIREBASE_PRIVATE_KEY")
    
    # Optional: Path to service account file for local testing
    FIREBASE_SERVICE_ACCOUNT_FILE = os.environ.get("FIREBASE_SERVICE_ACCOUNT_FILE", "firebase-service-account.json")
