const API_BASE_URL = "http://localhost:3000";

export const searchFurniture = async (furniture) => {
  try {
    console.log("Sending furniture data to backend:", furniture);

    const response = await fetch(`${API_BASE_URL}/search-furniture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ furniture }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received data from backend:", data);
    return data;
  } catch (error) {
    console.error("Error searching furniture:", error);
    throw error;
  }
};
