import apiClient from "./apiClient";

/**
 * Fetch all business owners for the logged-in user.
 */
export const fetchOwners = async () => {
  try {
    const response = await apiClient('/data');
    const data = await response.json();
    // Filter by type 'owner'
    return Array.isArray(data) ? data.filter(item => item.type === 'owner') : [];
  } catch (error) {
    console.error("Error fetching owners:", error);
    return [];
  }
};

/**
 * Add a new business owner.
 */
export const addOwner = async (ownerData) => {
  try {
    const response = await apiClient('/data', {
      method: "POST",
      body: JSON.stringify({ ...ownerData, type: 'owner' }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding owner:", error);
    return { success: false, message: "Error adding owner" };
  }
};

/**
 * Update an existing owner.
 */
export const updateOwner = async (ownerId, updateData) => {
  try {
    const response = await apiClient(`/data/${ownerId}`, {
      method: "PUT",
      body: JSON.stringify({ ...updateData, type: 'owner' }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating owner:", error);
    return { success: false, message: "Error updating owner" };
  }
};

/**
 * Delete an owner.
 */
export const deleteOwner = async (ownerId) => {
  try {
    const response = await apiClient(`/data/${ownerId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting owner:", error);
    return { success: false, message: "Error deleting owner" };
  }
};
