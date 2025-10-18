// Furniture Service - Handles all backend communication for furniture generation
const API_BASE_URL = 'http://localhost:3000';

/**
 * Generate furniture recommendations based on form data
 * @param {Object} formData - Form data from the frontend
 * @returns {Promise<Object>} - Response with furniture list and search queries
 */
export const generateFurniture = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-furniture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating furniture:', error);
    throw error;
  }
};

/**
 * Search for furniture items using SerpAPI
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Search results
 */
export const searchFurniture = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching furniture:', error);
    throw error;
  }
};

/**
 * Test the backend connection
 * @returns {Promise<Object>} - Server status
 */
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
};
