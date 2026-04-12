"""
Smart Store - Root Entry Point
==================================
Runs the application locally and provides the exported app for Vercel.
"""

from backend import create_app

app = create_app()

if __name__ == "__main__":
    print("\n[SERVER] Smart Store Backend running on http://127.0.0.1:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
