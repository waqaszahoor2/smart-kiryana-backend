import apiClient from "./apiClient";

/**
 * Fetch all products for the logged-in user.
 */
export const fetchProducts = async () => {
  try {
    const response = await apiClient('/data');
    const data = await response.json();
    // Filter by type 'product' if all data is in the same collection
    return Array.isArray(data) ? data.filter(item => item.type === 'product') : [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

/**
 * Add a new product.
 */
export const addProduct = async (productData) => {
  try {
    const response = await apiClient('/data', {
      method: "POST",
      body: JSON.stringify({ ...productData, type: 'product' }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, message: "Error adding product" };
  }
};

/**
 * Update an existing product.
 */
export const updateProduct = async (productId, updateData) => {
  try {
    const response = await apiClient(`/data/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ ...updateData, type: 'product' }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, message: "Error updating product" };
  }
};

/**
 * Delete a product.
 */
export const deleteProduct = async (productId) => {
  try {
    const response = await apiClient(`/data/${productId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, message: "Error deleting product" };
  }
};
