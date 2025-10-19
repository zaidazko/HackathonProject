import { getJson } from "serpapi";

/**
 * Fetches shopping results for multiple items
 * @param {string[]} items - Array of furniture item queries
 * @returns {Promise<Array>} - Array of objects: { item, results: [{title, price, link, source, thumbnail}] }
 */
export async function fetchShoppingResults(items = []) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is required");
  }

  const allResults = [];

  for (const item of items) {
    const searchResults = await getJson({
      engine: "google_shopping",
      q: item,
      api_key: process.env.SERPAPI_KEY,
      hl: "en",
      gl: "us",
    });

    if (searchResults.shopping_results) {
      allResults.push({
        item,
        results: searchResults.shopping_results.map(product => ({
          title: product.title,
          price: parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0,
          link: product.link,
          source: product.source,
          thumbnail: product.thumbnail
        }))
      });
    }
  }

  return allResults;
}
