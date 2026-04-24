"""
Smart Store - Product Routes
================================
REST API endpoints for managing store products / inventory.
"""

from flask import Blueprint, request, jsonify, session
import json
from ..db import get_connection, get_dict_cursor, get_last_id
from ..google_drive_sync import get_drive_service, get_or_create_folder, sync_products_to_drive

product_bp = Blueprint("product", __name__)

def sync_user_drive(user_id):
    """Helper to sync products to Google Drive."""
    try:
        connection = get_connection()
        cursor = get_dict_cursor(connection)

        # Get google credentials
        cursor.execute("SELECT google_credentials FROM users WHERE id = %s", (user_id,))
        user_row = cursor.fetchone()
        
        if not user_row or not user_row.get("google_credentials"):
            cursor.close()
            connection.close()
            return
            
        creds_json = user_row["google_credentials"]
        if isinstance(creds_json, str):
            creds_dict = json.loads(creds_json)
        else:
            creds_dict = creds_json

        # Get products
        cursor.execute("""
            SELECT p.*, bo.shop_name, bo.owner_name
            FROM products p
            INNER JOIN business_owner bo ON p.owner_id = bo.id
            WHERE bo.user_id = %s
        """, (user_id,))
        products = cursor.fetchall()
        
        # Serialize properly for JSON (datetime to string, decimal to float)
        result = []
        for p in products:
            row = dict(p)
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])
            if row.get("updated_at"):
                row["updated_at"] = str(row["updated_at"])
            if row.get("price") is not None:
                row["price"] = float(row["price"])
            if row.get("cost_price") is not None:
                row["cost_price"] = float(row["cost_price"])
            if row.get("quantity") is not None:
                row["quantity"] = float(row["quantity"])
            result.append(row)

        cursor.close()
        connection.close()

        # Drive operations
        service = get_drive_service(creds_dict)
        if service:
            folder_id = get_or_create_folder(service)
            if folder_id:
                sync_products_to_drive(service, result, folder_id)
                
    except Exception as e:
        print(f"Error in sync_user_drive: {e}")


@product_bp.route("/add-product", methods=["POST"])
def add_product():
    """
    Add a new product to the store inventory.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized. Please login."}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        owner_id = data.get("owner_id")
        product_name = data.get("product_name")
        category = data.get("category", "Other")
        price = data.get("price")
        cost_price = data.get("cost_price", 0)
        quantity = data.get("quantity")
        unit = data.get("unit", "kg")
        is_available = data.get("is_available", True)

        if not owner_id:
            return jsonify({"success": False, "message": "'owner_id' is required."}), 400

        if not product_name or not product_name.strip():
            return jsonify({"success": False, "message": "'product_name' is required."}), 400

        connection = get_connection()
        cursor = connection.cursor()

        # Verify owner belongs to user
        cursor.execute("SELECT id FROM business_owner WHERE id = %s AND user_id = %s", (owner_id, user_id))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Invalid owner ID for this user."}), 403

        query = """
            INSERT INTO products (owner_id, product_name, category, price, cost_price, quantity, unit, is_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (owner_id, product_name, category, float(price), float(cost_price), float(quantity), unit, bool(is_available)))
        connection.commit()

        new_id = get_last_id(cursor, connection, "products")
        cursor.close()
        connection.close()

        # Sync to drive
        sync_user_drive(user_id)

        return jsonify({
            "success": True,
            "message": "Product added successfully.",
            "data": {"id": new_id}
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500


@product_bp.route("/products", methods=["GET"])
def get_products():
    """
    Fetch products belonging to the logged-in user.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "Unauthorized. Please login."}), 401

    try:
        owner_id = request.args.get("owner_id")
        category = request.args.get("category")

        connection = get_connection()
        cursor = get_dict_cursor(connection)

        query = """
            SELECT p.*, bo.shop_name, bo.owner_name
            FROM products p
            INNER JOIN business_owner bo ON p.owner_id = bo.id
            WHERE bo.user_id = %s
        """
        params = [user_id]

        if owner_id:
            query += " AND p.owner_id = %s"
            params.append(int(owner_id))
        if category:
            query += " AND p.category = %s"
            params.append(category)

        query += " ORDER BY p.id ASC"

        cursor.execute(query, params)
        products = cursor.fetchall()

        result = []
        for product in products:
            row = dict(product)
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            if row.get("updated_at"):
                row["updated_at"] = row["updated_at"].strftime("%Y-%m-%d %H:%M:%S")
            row["is_available"] = bool(row.get("is_available", True))
            if row.get("price") is not None:
                row["price"] = float(row["price"])
            if row.get("cost_price") is not None:
                row["cost_price"] = float(row["cost_price"])
            if row.get("quantity") is not None:
                row["quantity"] = float(row["quantity"])
            result.append(row)

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Products fetched successfully.",
            "count": len(result),
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500


@product_bp.route("/product/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """
    Update a product belonging to the user.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized."}), 401

    try:
        data = request.get_json()
        connection = get_connection()
        cursor = get_dict_cursor(connection)

        # Check product exists and belongs to user
        cursor.execute("""
            SELECT p.* FROM products p 
            JOIN business_owner bo ON p.owner_id = bo.id 
            WHERE p.id = %s AND bo.user_id = %s
        """, (product_id, user_id))
        product = cursor.fetchone()
        if not product:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Product not found or access denied."}), 404

        fields = []
        values = []
        for field in ["product_name", "category", "unit"]:
            if field in data:
                fields.append(f"{field} = %s")
                values.append(data[field])

        for num_field in ["price", "cost_price", "quantity"]:
            if num_field in data:
                fields.append(f"{num_field} = %s")
                values.append(float(data[num_field]))

        if "is_available" in data:
            fields.append("is_available = %s")
            values.append(bool(data["is_available"]))

        if not fields:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "No fields to update."}), 400

        values.append(product_id)
        query = f"UPDATE products SET {', '.join(fields)} WHERE id = %s"
        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        # Sync to drive
        sync_user_drive(user_id)

        return jsonify({"success": True, "message": "Product updated successfully."}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500


@product_bp.route("/product/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """
    Delete a product belonging to the user.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized."}), 401

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Check permission
        cursor.execute("""
            SELECT p.id FROM products p 
            JOIN business_owner bo ON p.owner_id = bo.id 
            WHERE p.id = %s AND bo.user_id = %s
        """, (product_id, user_id))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Product not found or access denied."}), 404

        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        connection.commit()

        cursor.close()
        connection.close()

        # Sync to drive
        sync_user_drive(user_id)

        return jsonify({"success": True, "message": "Product deleted successfully."}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500


@product_bp.route("/products/summary", methods=["GET"])
def products_summary():
    """
    Get inventory summary for the logged-in user.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "Unauthorized."}), 401

    try:
        connection = get_connection()
        cursor = get_dict_cursor(connection)

        cursor.execute("""
            SELECT
                COUNT(p.id) as total_products,
                COALESCE(SUM(p.price * p.quantity), 0) as total_inventory_value,
                SUM(CASE WHEN p.quantity = 0 OR p.is_available = FALSE THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN p.quantity > 0 AND p.is_available = TRUE THEN 1 ELSE 0 END) as in_stock,
                COUNT(DISTINCT p.category) as total_categories
            FROM products p
            JOIN business_owner bo ON p.owner_id = bo.id
            WHERE bo.user_id = %s
        """, (user_id,))
        summary = cursor.fetchone()
        summary = dict(summary)
        summary["total_inventory_value"] = float(summary["total_inventory_value"])
        summary["out_of_stock"] = int(summary.get("out_of_stock") or 0)
        summary["in_stock"] = int(summary.get("in_stock") or 0)
        summary["total_products"] = int(summary.get("total_products") or 0)
        summary["total_categories"] = int(summary.get("total_categories") or 0)

        cursor.close()
        connection.close()

        return jsonify({"success": True, "data": summary}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
