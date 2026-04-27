import logging
from flask import Blueprint, request, jsonify, g
from ..middleware.auth import token_required
from ..services.firestore_service import FirestoreService

# Setup logging
logger = logging.getLogger(__name__)

data_bp = Blueprint('data', __name__)

@data_bp.route('/data', methods=['POST'])
@token_required
def create_data():
    """
    POST /data - Create new data for the authenticated user.
    """
    data = request.json
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    try:
        logger.info(f"[DATA] Creating new record for UID: {g.uid}")
        new_data = FirestoreService.create_data(g.uid, data)
        return jsonify(new_data), 201
    except Exception as e:
        logger.error(f"[DATA ERROR] Create failed: {str(e)}")
        return jsonify({'message': 'Error creating data', 'error': str(e)}), 500

@data_bp.route('/data', methods=['GET'])
@token_required
def get_data():
    """
    GET /data - Get all data for the authenticated user.
    """
    try:
        logger.info(f"[DATA] Fetching all records for UID: {g.uid}")
        data_list = FirestoreService.get_all_data(g.uid)
        return jsonify(data_list), 200
    except Exception as e:
        logger.error(f"[DATA ERROR] Fetch failed: {str(e)}")
        return jsonify({'message': 'Error fetching data', 'error': str(e)}), 500

@data_bp.route('/data/<doc_id>', methods=['PUT'])
@token_required
def update_data(doc_id):
    """
    PUT /data/:id - Update a specific record for the authenticated user.
    """
    data = request.json
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    try:
        logger.info(f"[DATA] Updating record {doc_id} for UID: {g.uid}")
        updated_data = FirestoreService.update_data(g.uid, doc_id, data)
        if not updated_data:
            logger.warning(f"[DATA] Record {doc_id} not found for UID: {g.uid}")
            return jsonify({'message': 'Data not found'}), 404
        return jsonify(updated_data), 200
    except Exception as e:
        logger.error(f"[DATA ERROR] Update failed for {doc_id}: {str(e)}")
        return jsonify({'message': 'Error updating data', 'error': str(e)}), 500

@data_bp.route('/data/<doc_id>', methods=['DELETE'])
@token_required
def delete_data(doc_id):
    """
    DELETE /data/:id - Delete a specific record for the authenticated user.
    """
    try:
        logger.info(f"[DATA] Deleting record {doc_id} for UID: {g.uid}")
        success = FirestoreService.delete_data(g.uid, doc_id)
        if not success:
            logger.warning(f"[DATA] Record {doc_id} not found for deletion for UID: {g.uid}")
            return jsonify({'message': 'Data not found'}), 404
        return jsonify({'message': 'Data deleted successfully'}), 200
    except Exception as e:
        logger.error(f"[DATA ERROR] Delete failed for {doc_id}: {str(e)}")
        return jsonify({'message': 'Error deleting data', 'error': str(e)}), 500
