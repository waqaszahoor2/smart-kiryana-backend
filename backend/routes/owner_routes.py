"""
Smart Store - Owner Routes
==============================
REST API endpoints for managing business owners.
"""

from flask import Blueprint, request, jsonify, session
from ..db import get_connection, get_dict_cursor, get_last_id

owner_bp = Blueprint("owner", __name__)


@owner_bp.route("/add-owner", methods=["POST"])
def add_owner():
    """
    Add a new business owner for the logged-in user.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized. Please login."}), 401

    try:
        data = request.get_json()
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

        connection = get_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO business_owner (user_id, shop_name, owner_name, phone, email)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, shop_name, owner_name, phone, email))
        connection.commit()

        new_id = get_last_id(cursor, connection, "business_owner")
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Owner added successfully.",
            "data": {"id": new_id}
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}"
        }), 500


@owner_bp.route("/owners", methods=["GET"])
def get_owners():
    """
    Fetch business owners for the logged-in user.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        # Fallback for mobile apps that might use a query param
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "Unauthorized. Please login."}), 401

    try:
        connection = get_connection()
        cursor = get_dict_cursor(connection)

        cursor.execute("SELECT * FROM business_owner WHERE user_id = %s ORDER BY id ASC", (user_id,))
        owners = cursor.fetchall()

        # Convert to regular dicts and format dates
        result = []
        for owner in owners:
            row = dict(owner)
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            result.append(row)

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Owners fetched successfully.",
            "count": len(result),
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}"
        }), 500
