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
    console.log(`Searching for: "${item}"`);

    const searchResults = await getJson({
      engine: "google_shopping",
      q: item,
      api_key: process.env.SERPAPI_KEY,
      hl: "en",
      gl: "us",
    });

    console.log(
      `Search results for "${item}":`,
      searchResults.shopping_results
        ? searchResults.shopping_results.length
        : 0,
      "items found"
    );

    // Debug: Log the first result to see what fields are available
    if (
      searchResults.shopping_results &&
      searchResults.shopping_results.length > 0
    ) {
      console.log(
        "First result fields:",
        Object.keys(searchResults.shopping_results[0])
      );
    }

    if (searchResults.shopping_results) {
      // Limit to 3-4 results as requested
      const limitedResults = searchResults.shopping_results.slice(0, 4);
      const processedResults = limitedResults.map((product) => {
        // Try different possible field names for the product URL
        const productLink =
          product.link ||
          product.product_link ||
          product.url ||
          product.product_url ||
          product.href ||
          product.website;

        return {
          title: product.title,
          price: parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0,
          link: productLink,
          source: product.source,
          thumbnail: product.thumbnail,
        };
      });

      allResults.push({
        item,
        results: processedResults,
      });
    } else {
      console.log(`No shopping results found for: "${item}"`);
      allResults.push({
        item,
        results: [],
      });
    }
  }

  return allResults;
}
