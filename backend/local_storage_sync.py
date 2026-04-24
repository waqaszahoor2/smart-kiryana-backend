import os
import json

def sync_products_to_local_storage(user_id, products_data):
    """Save products data to a local JSON file."""
    try:
        # Create local_storage directory if it doesn't exist
        directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "local_storage")
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        file_path = os.path.join(directory, f"products_backup_user_{user_id}.json")
        
        with open(file_path, "w") as f:
            json.dump(products_data, f, indent=4)
            
        print(f"Successfully synced products for user {user_id} to {file_path}")
    except Exception as e:
        print(f"Error saving to local storage: {e}")
