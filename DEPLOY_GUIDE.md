# 🚀 Smart Store - Cloud Deployment Guide (PythonAnywhere)

This guide will deploy your backend to the cloud so the app works **24/7** even when your PC is off.

---

## Step 1: Create a Free Account

1. Go to **[pythonanywhere.com](https://www.pythonanywhere.com)**
2. Click **"Start running Python online"** → **"Create a Beginner account"**
3. Sign up (remember your **username** — you'll need it!)

---

## Step 2: Create MySQL Database

1. Go to the **Databases** tab
2. Set a **MySQL password** and click "Initialize MySQL"
3. Under "Create a database", type: `smart_kiryana` and click **Create**
4. Note down:
   - **Database host**: `YOUR_USERNAME.mysql.pythonanywhere-services.com`
   - **Username**: `YOUR_USERNAME`
   - **Database name**: `YOUR_USERNAME$smart_kiryana`

---

## Step 3: Upload Backend Files

1. Go to the **Files** tab
2. Create a new directory: `smart-store`
3. Upload these files into `/home/YOUR_USERNAME/smart-store/`:
   - `app.py`
   - `config.py`
   - `db.py`
   - `requirements.txt`
   - `routes/` folder (with `__init__.py`, `owner_routes.py`, `product_routes.py`)
   - `models/` folder (with `__init__.py`)

---

## Step 4: Install Dependencies

1. Go to the **Consoles** tab → Start a **Bash console**
2. Run these commands:
```bash
cd smart-store
pip3 install --user flask flask-cors mysql-connector-python
```

---

## Step 5: Create Web App

1. Go to the **Web** tab
2. Click **"Add a new web app"**
3. Choose **"Manual configuration"** → **Python 3.10**
4. Set **Source code**: `/home/YOUR_USERNAME/smart-store`

---

## Step 6: Configure WSGI File

1. In the **Web** tab, click on the **WSGI configuration file** link
2. **Delete ALL existing content** and replace with:

```python
import sys
import os

project_home = '/home/YOUR_USERNAME/smart-store'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ['DB_HOST'] = 'YOUR_USERNAME.mysql.pythonanywhere-services.com'
os.environ['DB_USER'] = 'YOUR_USERNAME'
os.environ['DB_PASSWORD'] = 'YOUR_MYSQL_PASSWORD'
os.environ['DB_NAME'] = 'YOUR_USERNAME$smart_kiryana'
os.environ['FLASK_DEBUG'] = 'False'

from app import create_app
application = create_app()
```

3. **Replace** `YOUR_USERNAME` with your actual PythonAnywhere username
4. **Replace** `YOUR_MYSQL_PASSWORD` with the MySQL password you set in Step 2
5. Click **Save**

---

## Step 7: Reload & Test

1. Go back to the **Web** tab
2. Click the big green **"Reload"** button
3. Visit: `https://YOUR_USERNAME.pythonanywhere.com/`
4. You should see: `{"message": "Smart Store Backend Running", "success": true}`

---

## Step 8: Update App Config

After deployment, update the API URL in your app:

In `frontend/src/api/config.js`, change:
```javascript
const API_BASE_URL = "https://YOUR_USERNAME.pythonanywhere.com";
```

Then rebuild the APK with:
```bash
cd frontend
npx eas-cli build --platform android --profile preview
```

---

## ✅ Done!

Your app will now work **24/7** without your PC being on!
- Backend URL: `https://YOUR_USERNAME.pythonanywhere.com`
- No ngrok needed anymore
- Share the APK with anyone — it just works!

---

## 🔄 How to Update Code Later

1. Go to PythonAnywhere → Files tab
2. Edit/upload the changed files
3. Go to Web tab → Click **Reload**
4. Changes are live immediately!
