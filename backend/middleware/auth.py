import firebase_admin
from firebase_admin import auth, credentials
from flask import request, jsonify, g
from functools import wraps
import os

# Initialize Firebase Admin SDK
# In Cloud Run, it can use the default service account credentials
if not firebase_admin._apps:
    cred = None
    if os.path.exists('firebase-service-account.json'):
        cred = credentials.Certificate('firebase-service-account.json')
    firebase_admin.initialize_app(cred)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
            g.uid = decoded_token['uid']
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated
