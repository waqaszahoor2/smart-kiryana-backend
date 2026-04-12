"""
Smart Store - Vercel Serverless Entry Point
=============================================
This file is the entry point for Vercel's Python serverless functions.
Vercel will auto-discover this and route all requests through the Flask app.
"""

from app import create_app

app = create_app()
