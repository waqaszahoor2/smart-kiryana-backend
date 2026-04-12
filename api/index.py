"""
Smart Store - Vercel Entry Point
=================================
Imports the app factory from the backend package.
"""

from backend import create_app

app = create_app()
