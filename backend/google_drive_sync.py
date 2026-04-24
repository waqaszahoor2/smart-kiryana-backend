import json
import requests

FOLDER_NAME = 'Smart Kiryana Storage'

def get_or_create_folder(access_token, folder_name=FOLDER_NAME):
    """Check if the folder exists, if not create it using Drive REST API."""
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Search for the folder
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        search_url = f"https://www.googleapis.com/drive/v3/files?q={query}&spaces=drive&fields=files(id,name)"
        res = requests.get(search_url, headers=headers)
        
        if res.status_code != 200:
            print(f"Error searching folder: {res.text}")
            return None
            
        items = res.json().get('files', [])

        if not items:
            # Create folder
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            create_url = "https://www.googleapis.com/drive/v3/files"
            create_res = requests.post(create_url, headers=headers, json=file_metadata)
            if create_res.status_code == 200:
                return create_res.json().get('id')
            else:
                print(f"Error creating folder: {create_res.text}")
                return None
        else:
            return items[0].get('id')
    except Exception as e:
        print(f"Error in get_or_create_folder: {e}")
        return None

def sync_products_to_drive(access_token, products_data, folder_id):
    """Upload or update the products.json file in the specified Drive folder."""
    try:
        file_name = 'products_backup.json'
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        # Check if file already exists in folder
        query = f"name='{file_name}' and '{folder_id}' in parents and trashed=false"
        search_url = f"https://www.googleapis.com/drive/v3/files?q={query}&spaces=drive&fields=files(id,name)"
        res = requests.get(search_url, headers=headers)
        
        if res.status_code != 200:
            print(f"Error searching file: {res.text}")
            return
            
        items = res.json().get('files', [])
        
        # Prepare the file content
        file_content = json.dumps(products_data, indent=4)
        
        if not items:
            # Create new file (Multipart upload)
            metadata = {
                'name': file_name,
                'parents': [folder_id]
            }
            files = {
                'data': ('metadata', json.dumps(metadata), 'application/json; charset=UTF-8'),
                'file': ('products.json', file_content, 'application/json')
            }
            upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
            create_res = requests.post(upload_url, headers=headers, files=files)
            if create_res.status_code == 200:
                print(f"Created file ID: {create_res.json().get('id')}")
            else:
                print(f"Error creating file: {create_res.text}")
        else:
            # Update existing file
            file_id = items[0].get('id')
            update_url = f"https://www.googleapis.com/upload/drive/v3/files/{file_id}?uploadType=media"
            update_headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            update_res = requests.patch(update_url, headers=update_headers, data=file_content.encode('utf-8'))
            if update_res.status_code == 200:
                print(f"Updated file ID: {file_id}")
            else:
                print(f"Error updating file: {update_res.text}")
            
    except Exception as e:
        print(f"Error syncing products: {e}")

def refresh_google_token(refresh_token, client_id, client_secret):
    """Refresh the access token using the refresh token."""
    try:
        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        res = requests.post(url, data=data)
        if res.status_code == 200:
            return res.json().get("access_token")
        else:
            print(f"Error refreshing token: {res.text}")
            return None
    except Exception as e:
        print(f"Error in refresh_google_token: {e}")
        return None
