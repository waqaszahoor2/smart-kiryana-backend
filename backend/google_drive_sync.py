import os
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

SCOPES = ['https://www.googleapis.com/auth/drive.file']
FOLDER_NAME = 'Smart Kiryana Storage'

def get_drive_service(credentials_dict):
    """Build and return the Drive service using stored credentials dict."""
    if not credentials_dict:
        return None
    creds = Credentials(
        token=credentials_dict.get('token'),
        refresh_token=credentials_dict.get('refresh_token'),
        token_uri=credentials_dict.get('token_uri', 'https://oauth2.googleapis.com/token'),
        client_id=credentials_dict.get('client_id'),
        client_secret=credentials_dict.get('client_secret'),
        scopes=SCOPES
    )
    return build('drive', 'v3', credentials=creds)

def get_or_create_folder(service, folder_name=FOLDER_NAME):
    """Check if the folder exists, if not create it."""
    try:
        # Search for the folder
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        items = results.get('files', [])

        if not items:
            # Create folder
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = service.files().create(body=file_metadata, fields='id').execute()
            return folder.get('id')
        else:
            return items[0].get('id')
    except Exception as e:
        print(f"Error creating folder: {e}")
        return None

def sync_products_to_drive(service, products_data, folder_id):
    """Upload or update the products.json file in the specified Drive folder."""
    try:
        file_name = 'products_backup.json'
        
        # Check if file already exists in folder
        query = f"name='{file_name}' and '{folder_id}' in parents and trashed=false"
        results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        items = results.get('files', [])

        file_metadata = {
            'name': file_name,
            'parents': [folder_id]
        }
        
        # Prepare the file content
        file_content = json.dumps(products_data, indent=4)
        media = MediaIoBaseUpload(io.BytesIO(file_content.encode('utf-8')), mimetype='application/json', resumable=True)

        if not items:
            # Create new file
            file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            print(f"Created file ID: {file.get('id')}")
        else:
            # Update existing file
            file_id = items[0].get('id')
            file = service.files().update(fileId=file_id, media_body=media).execute()
            print(f"Updated file ID: {file_id}")
            
    except Exception as e:
        print(f"Error syncing products: {e}")

def get_all_products_for_user(connection, user_id):
    """Helper to fetch all products for a user to sync"""
    cursor = connection.cursor(dictionary=True)
    # Check if postgres or mysql by seeing cursor type
    # For simplicity, handle both if possible, or use the db.py get_dict_cursor
    pass # we will implement this via existing routes

