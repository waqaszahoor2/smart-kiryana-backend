from google.cloud import firestore
from ..config import Config

# Initialize Firestore client
# Use project ID from config if available
db = firestore.Client(project=Config.FIREBASE_PROJECT_ID) if Config.FIREBASE_PROJECT_ID else firestore.Client()

class FirestoreService:
    @staticmethod
    def get_user_data_collection(uid):
        """
        Returns the reference to the user's data collection: users/{uid}/data
        """
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
