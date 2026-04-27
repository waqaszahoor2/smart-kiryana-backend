/**
 * Smart Store - API Configuration
 * ==================================
 * Central configuration for backend API connection.
 *
 * CURRENT: Using ngrok public URL (works for everyone globally)
 *
 * To change URL:
 * 1. For local testing (web browser): use http://localhost:5000
 * 2. For Android Emulator: use http://10.0.2.2:5000
 * 3. For mobile on same WiFi: use http://YOUR_PC_IP:5000
 * 4. For production: use your Google Cloud Run URL
 * 5. For global development: use ngrok URL (current setup)
 */

// ===== GLOBAL PUBLIC URL (works for everyone) =====
const API_BASE_URL = "https://ryder-residential-palatably.ngrok-free.dev";

export default API_BASE_URL;
