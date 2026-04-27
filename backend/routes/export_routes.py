"""
Smart Store - Export Routes
==============================
Endpoints for exporting data to CSV/JSON.
"""

import csv
import io
from flask import Blueprint, request, jsonify, session, Response
from ..db import get_connection, get_dict_cursor

export_bp = Blueprint("export", __name__)


@export_bp.route("/export/csv", methods=["GET"])
def export_csv():
    """
    Export all owners and products for the logged-in user to a single CSV.
    """
    user_id = session.get("user_id") or request.headers.get("X-User-Id")
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized."}), 401

    try:
        connection = get_connection()
        cursor = get_dict_cursor(connection)

        # Fetch joined data: Owners + Products
        # We use a LEFT JOIN to include owners even if they have no products
        query = """
            SELECT 
                bo.shop_name, 
                bo.owner_name, 
                bo.phone as owner_phone,
                p.display_id,
                p.product_name, 
                p.category, 
                p.price, 
                p.cost_price, 
                p.quantity, 
                p.unit,
                p.is_available
            FROM business_owner bo
            LEFT JOIN products p ON bo.id = p.owner_id
            WHERE bo.user_id = %s
            ORDER BY bo.shop_name ASC, p.display_id ASC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        
        cursor.close()
        connection.close()

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "Shop Name", "Owner Name", "Owner Phone", 
            "Product ID", "Product Name", "Category", 
            "Selling Price", "Cost Price", "Quantity", "Unit", "In Stock"
        ])
        
        for row in rows:
            writer.writerow([
                row.get("shop_name"),
                row.get("owner_name"),
                row.get("owner_phone"),
                row.get("display_id") if row.get("product_name") else "",
                row.get("product_name") or "— No Products —",
                row.get("category") or "",
                row.get("price") if row.get("product_name") else "",
                row.get("cost_price") if row.get("product_name") else "",
                row.get("quantity") if row.get("product_name") else "",
                row.get("unit") or "",
                "Yes" if row.get("is_available") else "No" if row.get("product_name") else ""
            ])

        # Prepare response
        csv_data = output.getvalue()
        output.close()
        
        filename = "smart_store_data.csv"
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        return jsonify({"success": False, "message": f"Export failed: {str(e)}"}), 500
