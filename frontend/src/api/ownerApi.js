/**
 * Smart Store - Owner API Service
 * ===================================
 * Handles all API calls related to business owners.
 * Includes timeout handling for mobile networks.
 */

import API_BASE_URL from "./config";

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper: fetch with timeout (10 seconds)
 */
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    // Get user_id from AsyncStorage
    let userId = null;
    try {
        userId = await AsyncStorage.getItem('user_id');
        // Temporary fallback for testing if no login is implemented yet
        if (!userId) userId = "1"; 
    } catch (e) {
        console.error("Error reading user_id", e);
    }

    // Merge headers with ngrok-skip-browser-warning to bypass ngrok interstitial
    const headers = {
        "ngrok-skip-browser-warning": "true",
        ...(userId ? { "X-User-Id": userId } : {}),
        ...(options.headers || {}),
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

/**
 * Fetch all business owners from the backend.
 * @returns {Promise<Object>} API response with owners data.
 */
export const fetchOwners = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/owners`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching owners:", error);
        return {
            success: false,
            message: error.name === "AbortError"
                ? "Request timed out. Check your internet connection."
                : "Network error. Make sure the backend is running.",
            data: [],
        };
    }
};

/**
 * Add a new business owner.
 * @param {Object} ownerData - Owner details { shop_name, owner_name, phone, email }
 * @returns {Promise<Object>} API response.
 */
export const addOwner = async (ownerData) => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/add-owner`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ownerData),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error adding owner:", error);
        return {
            success: false,
            message: error.name === "AbortError"
                ? "Request timed out. Check your internet connection."
                : "Network error. Make sure the backend is running.",
        };
    }
};
