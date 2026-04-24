"""
Smart Store - Authentication Routes
======================================
Handles user registration, login, logout, and session management.
"""

from flask import Blueprint, request, jsonify, session, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from ..db import get_connection, get_dict_cursor
import os
import json
import requests
from google_auth_oauthlib.flow import Flow

auth_bp = Blueprint("auth", __name__)

# Google OAuth Configuration
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
    'https://www.googleapis.com/auth/drive.file'
]
CLIENT_SECRETS_FILE = os.environ.get("GOOGLE_CLIENT_SECRETS_FILE", "client_secret.json")


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new user account."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({"success": False, "message": "Name, email, and password are required."}), 400

        if len(password) < 8:
            return jsonify({"success": False, "message": "Password must be at least 8 characters."}), 400

        import re
        if not re.search(r'[A-Z]', password):
            return jsonify({"success": False, "message": "Password must contain at least one uppercase letter."}), 400
        if not re.search(r'[a-z]', password):
            return jsonify({"success": False, "message": "Password must contain at least one lowercase letter."}), 400
        if not re.search(r'[0-9]', password):
            return jsonify({"success": False, "message": "Password must contain at least one number."}), 400
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]', password):
            return jsonify({"success": False, "message": "Password must contain at least one special symbol."}), 400

        connection = get_connection()
        cursor = get_dict_cursor(connection)

        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Email already registered."}), 409

        # Insert new user
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, provider) VALUES (%s, %s, %s, %s)",
            (name, email, password_hash, "email"),
        )
        connection.commit()

        # Get the new user
        cursor.execute("SELECT id, name, email, provider FROM users WHERE email = %s", (email,))
        user_row = cursor.fetchone()
        user = dict(user_row)
        cursor.close()
        connection.close()

        # Set session
        session["user_id"] = user["id"]
        session["user_email"] = user["email"]
        session["user_name"] = user["name"]

        return jsonify({
            "success": True,
            "message": "Account created successfully!",
            "user": user
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Login with email and password."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        email = (data.get("email") or "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required."}), 400

        connection = get_connection()
        cursor = get_dict_cursor(connection)

        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user_row = cursor.fetchone()
        cursor.close()
        connection.close()

        if not user_row:
            return jsonify({"success": False, "message": "No account found with this email."}), 404

        user = dict(user_row)

        # Check password
        if not check_password_hash(user["password_hash"], password):
            return jsonify({"success": False, "message": "Incorrect password."}), 401

        # Set session
        session["user_id"] = user["id"]
        session["user_email"] = user["email"]
        session["user_name"] = user["name"]

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "provider": user["provider"],
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@auth_bp.route("/auth/social", methods=["POST"])
def social_login():
    """Login or register with a social provider."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        provider = data.get("provider", "")
        provider_id = data.get("provider_id", "")

        if not email or not provider:
            return jsonify({"success": False, "message": "Email and provider are required."}), 400

        connection = get_connection()
        cursor = get_dict_cursor(connection)

        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user_row = cursor.fetchone()

        if user_row:
            user = dict(user_row)
            # Update provider if it was email but now social
            if user["provider"] == "email":
               cursor.execute("UPDATE users SET provider = %s, provider_id = %s WHERE id = %s", (provider, provider_id, user["id"]))
               connection.commit()
               user["provider"] = provider
        else:
            # Auto-register
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, provider, provider_id) VALUES (%s, %s, %s, %s, %s)",
                (name, email, "", provider, provider_id),
            )
            connection.commit()
            cursor.execute("SELECT id, name, email, provider FROM users WHERE email = %s", (email,))
            user = dict(cursor.fetchone())

        cursor.close()
        connection.close()

        # Set session
        session["user_id"] = user["id"]
        session["user_email"] = user["email"]
        session["user_name"] = user["name"]

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "provider": user.get("provider", provider),
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@auth_bp.route("/auth/me", methods=["GET"])
def get_current_user():
    """Check if user is logged in and return their info."""
    if "user_id" in session:
        return jsonify({
            "success": True,
            "user": {
                "id": session["user_id"],
                "name": session.get("user_name", ""),
                "email": session.get("user_email", ""),
            }
        }), 200
    return jsonify({"success": False, "message": "Not logged in."}), 401


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """Log out the current user."""
    session.clear()
    return jsonify({"success": True, "message": "Logged out."}), 200


@auth_bp.route("/auth/google/login", methods=["GET"])
def google_login():
    """Initiate Google OAuth Flow."""
    try:
        # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=request.host_url.rstrip('/') + "/auth/google/callback"
        )
        # Generate URL for request to Google's OAuth 2.0 server.
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        session['state'] = state
        return redirect(authorization_url)
    except FileNotFoundError:
        return jsonify({"success": False, "message": "Google Client Secrets file not found. Please setup GCP and place client_secret.json in the project root."}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Error initiating Google Login: {str(e)}"}), 500


@auth_bp.route("/auth/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth Callback."""
    try:
        state = session.get('state')
        
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            state=state,
            redirect_uri=request.host_url.rstrip('/') + "/auth/google/callback"
        )
        
        # Use the authorization server's response to fetch the OAuth 2.0 tokens
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        
        # Get user info
        user_info_service = requests.get(
            f"https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token={credentials.token}"
        )
        user_info = user_info_service.json()
        
        email = user_info.get("email").lower()
        name = user_info.get("name")
        provider_id = user_info.get("id")
        
        creds_dict = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        creds_json = json.dumps(creds_dict)
        
        connection = get_connection()
        cursor = get_dict_cursor(connection)

        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user_row = cursor.fetchone()

        if user_row:
            user = dict(user_row)
            # Update credentials
            cursor.execute(
                "UPDATE users SET provider = %s, provider_id = %s, google_credentials = %s WHERE id = %s", 
                ("google", provider_id, creds_json, user["id"])
            )
            connection.commit()
            user["provider"] = "google"
        else:
            # Auto-register
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, provider, provider_id, google_credentials) VALUES (%s, %s, %s, %s, %s, %s)",
                (name, email, "", "google", provider_id, creds_json),
            )
            connection.commit()
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = dict(cursor.fetchone())

        cursor.close()
        connection.close()

        # Set session
        session["user_id"] = user["id"]
        session["user_email"] = user["email"]
        session["user_name"] = user["name"]

        # Redirect to frontend with a success flag
        # You could also use a JWT or just set a cookie
        html_redirect = f\"\"\"
        <html>
            <body>
                <script>
                    localStorage.setItem('smartstore_user', JSON.stringify({{
                        id: {user['id']},
                        name: "{user['name']}",
                        email: "{user['email']}",
                        provider: "google"
                    }}));
                    localStorage.setItem('smartstore_last_activity', Date.now().toString());
                    window.location.href = '/dashboard';
                </script>
            </body>
        </html>
        \"\"\"
        return html_redirect

    except Exception as e:
        return jsonify({"success": False, "message": f"Error in Google callback: {str(e)}"}), 500

