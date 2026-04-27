from google.cloud import firestore
import logging
from ..config import Config

logger = logging.getLogger(__name__)

# Global variable to cache the client
_db_client = None

def get_db():
    """
    Returns a cached Firestore client instance.
    Initializes lazily to prevent module-level import crashes.
    """
    global _db_client
    if _db_client is None:
        try:
            logger.info("[FIRESTORE] Initializing Firestore client...")
            if Config.FIREBASE_PROJECT_ID:
                _db_client = firestore.Client(project=Config.FIREBASE_PROJECT_ID)
            else:
                _db_client = firestore.Client()
            logger.info("[FIRESTORE] Client initialized successfully.")
        except Exception as e:
            logger.error(f"[FIRESTORE ERROR] Client initialization failed: {str(e)}")
            # On Vercel, we might want to raise here so the health check or route fails gracefully
            # but with the global error handler it will be caught.
            raise e
    return _db_client

class FirestoreService:
    @staticmethod
    def get_user_data_collection(uid):
        """
        Returns the reference to the user's data collection: users/{uid}/data
        """
        db = get_db()
        return db.collection('users').document(uid).collection('data')

    @staticmethod
    def create_data(uid, data):
        """
        Creates a new document in the user's data collection.
        """
        doc_ref = FirestoreService.get_user_data_collection(uid).document()
        data['id'] = doc_ref.id
        doc_ref.set(data)
        return data

    @staticmethod
    def get_all_data(uid):
        """
        Retrieves all documents from the user's data collection.
        """
        docs = FirestoreService.get_user_data_collection(uid).stream()
        return [doc.to_dict() for doc in docs]

    @staticmethod
    def update_data(uid, doc_id, data):
        """
        Updates a specific document in the user's data collection.
        """
        doc_ref = FirestoreService.get_user_data_collection(uid).document(doc_id)
        if not doc_ref.get().exists:
            return None
        doc_ref.update(data)
        return data

    @staticmethod
    def delete_data(uid, doc_id):
        """
        Deletes a specific document from the user's data collection.
        """
        doc_ref = FirestoreService.get_user_data_collection(uid).document(doc_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
