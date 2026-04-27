/**
 * Smart Store - Product API Service
 * =====================================
 * Handles all API calls related to store products/inventory.
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

const getErrorMessage = (error) => {
    if (error.name === "AbortError") return "Request timed out. Check your internet connection.";
    return "Network error. Make sure the backend is running.";
};

/**
 * Fetch all products, optionally filtered by owner or category.
 */
export const fetchProducts = async (ownerId = null, category = null) => {
    try {
        let url = `${API_BASE_URL}/products`;
        const params = [];
        if (ownerId) params.push(`owner_id=${ownerId}`);
        if (category) params.push(`category=${category}`);
        if (params.length) url += `?${params.join("&")}`;

        const response = await fetchWithTimeout(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            success: false,
            message: getErrorMessage(error),
            data: [],
        };
    }
};

/**
 * Add a new product.
 */
export const addProduct = async (productData) => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/add-product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productData),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, message: getErrorMessage(error) };
    }
};

/**
 * Update an existing product.
 */
export const updateProduct = async (productId, updateData) => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/product/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: getErrorMessage(error) };
    }
};

/**
 * Delete a product.
 */
export const deleteProduct = async (productId) => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/product/${productId}`, {
            method: "DELETE",
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: getErrorMessage(error) };
    }
};

/**
 * Get inventory summary stats.
 */
export const fetchProductsSummary = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products/summary`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching summary:", error);
        return { success: false, data: {} };
    }
};
