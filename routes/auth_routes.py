"""
Smart Store - Authentication Routes
======================================
Handles user registration, login, logout, and session management.
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection, get_dict_cursor

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """
    Register a new user account.

    Expects JSON body:
    {
        "name": "string (required)",
        "email": "string (required)",
        "password": "string (required, min 6 chars)"
    }
    """
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
        user = dict(cursor.fetchone())
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
    """
    Login with email and password.

    Expects JSON body:
    {
        "email": "string (required)",
        "password": "string (required)"
    }
    """
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
        user = cursor.fetchone()
        cursor.close()
        connection.close()

        if not user:
            return jsonify({"success": False, "message": "No account found with this email."}), 404

        user = dict(user)

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
    """
    Login or register with a social provider (Google / GitHub).
    The frontend sends the user info after OAuth.

    Expects JSON body:
    {
        "name": "string",
        "email": "string",
        "provider": "google" | "github",
        "provider_id": "string (optional)"
    }
    """
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
        user = cursor.fetchone()

        if user:
            user = dict(user)
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
