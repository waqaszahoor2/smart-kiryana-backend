import firebase_admin
from firebase_admin import auth, credentials
from flask import request, jsonify, g
from functools import wraps
import os
import logging
from ..config import Config

# Setup logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def initialize_firebase():
    """
    Initializes the Firebase Admin SDK safely.
    Handles environment variables (Vercel) and service account file (Local).
    """
    if not firebase_admin._apps:
        try:
            # 1. Try environment variables (Priority for Vercel/Production)
            if Config.FIREBASE_PROJECT_ID and Config.FIREBASE_PRIVATE_KEY and Config.FIREBASE_CLIENT_EMAIL:
                logger.info("[FIREBASE] Initializing from environment variables.")
                
                # Fix for Vercel private key line breaks
                private_key = Config.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
                
                cred_dict = {
                    "project_id": Config.FIREBASE_PROJECT_ID,
                    "private_key": private_key,
                    "client_email": Config.FIREBASE_CLIENT_EMAIL,
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("[FIREBASE] Initialized successfully with env vars.")
                
            # 2. Try local service account file
            elif os.path.exists(Config.FIREBASE_SERVICE_ACCOUNT_FILE):
                logger.info(f"[FIREBASE] Initializing from file: {Config.FIREBASE_SERVICE_ACCOUNT_FILE}")
                cred = credentials.Certificate(Config.FIREBASE_SERVICE_ACCOUNT_FILE)
                firebase_admin.initialize_app(cred)
                logger.info("[FIREBASE] Initialized successfully from file.")
                
            # 3. Fallback to default credentials (Cloud Run)
            else:
                logger.info("[FIREBASE] Initializing with default credentials.")
                firebase_admin.initialize_app()
                logger.info("[FIREBASE] Initialized successfully with defaults.")
                
        except Exception as e:
            logger.error(f"[FIREBASE ERROR] Initialization failed: {str(e)}")
            # Do not raise here to prevent startup crash, but log it clearly

# Call initialization
initialize_firebase()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            token = None
            
            # Log incoming request
            logger.info(f"[API] Request: {request.method} {request.path}")
            
            # Check for Authorization header
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                logger.warning("[AUTH] Token is missing from request.")
                return jsonify({'success': False, 'message': 'Authentication token is missing!'}), 401
            
            try:
                # Verify the Firebase ID token
                decoded_token = auth.verify_id_token(token)
                g.uid = decoded_token['uid']
                logger.info(f"[AUTH] Token verified for UID: {g.uid}")
            except Exception as auth_error:
                logger.error(f"[AUTH ERROR] Token verification failed: {str(auth_error)}")
                return jsonify({
                    'success': False, 
                    'message': 'Invalid or expired token!',
                    'error': str(auth_error)
                }), 401
            
            return f(*args, **kwargs)
            
        except Exception as global_error:
            logger.error(f"[CRITICAL ERROR] Error in auth middleware: {str(global_error)}")
            return jsonify({
                'success': False,
                'message': 'Internal Server Error during authentication',
                'error': str(global_error)
            }), 500
    
    return decorated
