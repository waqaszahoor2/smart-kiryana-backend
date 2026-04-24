# Smart Kiryana Project

Coding standards and context for the Smart Kiryana (Smart Store) project.

## Build and Run Commands

### Backend (Flask)
- **Install dependencies**: `pip install -r requirements.txt`
- **Run locally**: `python app.py`
- **Production (Cloud Run)**: `gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app`

### Frontend (React Native/Expo)
- **Install dependencies**: `cd frontend && npm install`
- **Run locally**: `cd frontend && npx expo start`
- **Build (Android)**: `cd frontend && eas build --platform android`
- **Build (iOS)**: `cd frontend && eas build --platform ios`

## Project Structure
- `backend/`: Flask application logic and routes.
- `frontend/`: React Native (Expo) mobile application.
- `static/`: Static web files (served by Flask).
- `models/`: Database models/schemas.
- `api/`: Vercel-specific entry points.

## Coding Standards
- **Authentication**: Use `X-User-Id` header for API requests from the mobile app.
- **API Responses**: Always return JSON with `success: boolean` and `message: string`.
- **Database**: Uses PostgreSQL/MySQL (configured in `backend/config.py`).
- **Imports**: Use relative imports within the `backend` package.
