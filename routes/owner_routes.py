"""
Smart Store - Owner Routes
==============================
REST API endpoints for managing business owners.
"""

from flask import Blueprint, request, jsonify
from db import get_connection

owner_bp = Blueprint("owner", __name__)


@owner_bp.route("/add-owner", methods=["POST"])
def add_owner():
    """
    Add a new business owner.

    Expects JSON body:
    {
        "shop_name": "string (required)",
        "owner_name": "string (required)",
        "phone": "string (optional)",
        "email": "string (optional)"
    }

    Returns:
        201: Owner created successfully.
        400: Missing required fields.
        500: Internal server error.
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        shop_name = data.get("shop_name")
        owner_name = data.get("owner_name")
        phone = data.get("phone", "")
        email = data.get("email", "")

        if not shop_name or not owner_name:
            return jsonify({
                "success": False,
                "message": "Both 'shop_name' and 'owner_name' are required."
            }), 400

        # Insert into database
        connection = get_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO business_owner (shop_name, owner_name, phone, email)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (shop_name, owner_name, phone, email))
        connection.commit()

        new_id = cursor.lastrowid
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Owner added successfully.",
            "data": {"id": new_id}
        }), 201

    except Error as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500


@owner_bp.route("/owners", methods=["GET"])
def get_owners():
    """
    Fetch all business owners.

    Returns:
        200: List of all owners.
        500: Internal server error.
    """
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM business_owner ORDER BY created_at DESC")
        owners = cursor.fetchall()

        # Convert datetime objects to strings for JSON serialization
        for owner in owners:
            if owner.get("created_at"):
                owner["created_at"] = owner["created_at"].strftime("%Y-%m-%d %H:%M:%S")

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Owners fetched successfully.",
            "count": len(owners),
            "data": owners
        }), 200

    except Error as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500
