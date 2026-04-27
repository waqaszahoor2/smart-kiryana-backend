import os

class Config:
    """Base configuration for Cloud Run."""
    
    # Flask settings
    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    SECRET_KEY = os.environ.get("SECRET_KEY", os.urandom(24).hex())
    
    # Firebase configuration
    # FIREBASE_PROJECT_ID will be automatically used by google-cloud-firestore
    # if not explicitly provided, it uses the default project where Cloud Run is hosted.
    FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID")
