import API_BASE_URL from "./config";
import { auth } from "./firebase";

/**
 * Centalized API client that automatically attaches the Firebase ID token.
 */
const apiClient = async (endpoint, options = {}) => {
  const user = auth.currentUser;
  let token = null;

  if (user) {
    try {
      token = await user.getIdToken();
    } catch (e) {
      console.error("Error getting ID token:", e);
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      console.warn("Unauthorized request");
    }

    return response;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
};

export default apiClient;
