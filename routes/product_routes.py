"""
Smart Store - Product Routes
================================
REST API endpoints for managing store products / inventory.
"""

from flask import Blueprint, request, jsonify
from db import get_connection

product_bp = Blueprint("product", __name__)


@product_bp.route("/add-product", methods=["POST"])
def add_product():
    """
    Add a new product to the store inventory.

    Expects JSON body:
    {
        "owner_id": int (required),
        "product_name": "string (required)",
        "category": "string (optional, e.g. Grain, Sugar, Oil, Spice, Dairy, Snack, Beverage, Other)",
        "price": float (required),
        "quantity": int (required),
        "unit": "string (optional, e.g. kg, litre, packet, piece)",
        "is_available": bool (optional, default true)
    }

    Returns:
        201: Product added successfully.
        400: Missing required fields.
        500: Internal server error.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        owner_id = data.get("owner_id")
        product_name = data.get("product_name")
        category = data.get("category", "Other")
        price = data.get("price")
        quantity = data.get("quantity")
        unit = data.get("unit", "kg")
        is_available = data.get("is_available", True)

        # Validate required fields
        if not owner_id:
            return jsonify({"success": False, "message": "'owner_id' is required."}), 400
        if not product_name:
            return jsonify({"success": False, "message": "'product_name' is required."}), 400
        if price is None:
            return jsonify({"success": False, "message": "'price' is required."}), 400
        if quantity is None:
            return jsonify({"success": False, "message": "'quantity' is required."}), 400

        connection = get_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO products (owner_id, product_name, category, price, quantity, unit, is_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (owner_id, product_name, category, float(price), int(quantity), unit, bool(is_available)))
        connection.commit()

        new_id = cursor.lastrowid
        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Product added successfully.",
            "data": {"id": new_id}
        }), 201

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@product_bp.route("/products", methods=["GET"])
def get_products():
    """
    Fetch all products. Optionally filter by owner_id or category.

    Query params:
        owner_id (optional): Filter products by owner.
        category (optional): Filter products by category.

    Returns:
        200: List of products with owner info.
        500: Internal server error.
    """
    try:
        owner_id = request.args.get("owner_id")
        category = request.args.get("category")

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT p.*, bo.shop_name, bo.owner_name
            FROM products p
            LEFT JOIN business_owner bo ON p.owner_id = bo.id
            WHERE 1=1
        """
        params = []

        if owner_id:
            query += " AND p.owner_id = %s"
            params.append(int(owner_id))
        if category:
            query += " AND p.category = %s"
            params.append(category)

        query += " ORDER BY p.created_at DESC"

        cursor.execute(query, params)
        products = cursor.fetchall()

        for product in products:
            if product.get("created_at"):
                product["created_at"] = product["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            if product.get("updated_at"):
                product["updated_at"] = product["updated_at"].strftime("%Y-%m-%d %H:%M:%S")
            product["is_available"] = bool(product.get("is_available", True))

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Products fetched successfully.",
            "count": len(products),
            "data": products
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@product_bp.route("/product/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """
    Update a product's price, quantity, or availability.

    Expects JSON body (all optional):
    {
        "price": float,
        "quantity": int,
        "is_available": bool,
        "product_name": "string",
        "category": "string",
        "unit": "string"
    }

    Returns:
        200: Product updated.
        404: Product not found.
        500: Internal server error.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # Check product exists
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Product not found."}), 404

        # Build dynamic update query
        fields = []
        values = []

        for field in ["product_name", "category", "unit"]:
            if field in data:
                fields.append(f"{field} = %s")
                values.append(data[field])

        if "price" in data:
            fields.append("price = %s")
            values.append(float(data["price"]))

        if "quantity" in data:
            fields.append("quantity = %s")
            values.append(int(data["quantity"]))

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

        return jsonify({
            "success": True,
            "message": "Product updated successfully."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@product_bp.route("/product/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """
    Delete a product from inventory.

    Returns:
        200: Product deleted.
        404: Product not found.
        500: Internal server error.
    """
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({"success": False, "message": "Product not found."}), 404

        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Product deleted successfully."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500


@product_bp.route("/products/summary", methods=["GET"])
def products_summary():
    """
    Get inventory summary — total products, total value, out of stock count.

    Returns:
        200: Summary stats.
    """
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                COUNT(*) as total_products,
                COALESCE(SUM(price * quantity), 0) as total_inventory_value,
                SUM(CASE WHEN quantity = 0 OR is_available = FALSE THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN quantity > 0 AND is_available = TRUE THEN 1 ELSE 0 END) as in_stock,
                COUNT(DISTINCT category) as total_categories
            FROM products
        """)
        summary = cursor.fetchone()

        # Convert Decimal to float for JSON serialization
        summary["total_inventory_value"] = float(summary["total_inventory_value"])

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "data": summary
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500
