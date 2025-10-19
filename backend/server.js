import dotenv from "dotenv";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchShoppingResults } from "./serpServiceAPI.js"; // import the module
import { getJson } from "serpapi";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Simple Gemini test route
app.post("/test-gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      success: true,
      response: response.text(),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/* Simple SerpAPI search route
app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const searchResults = await getJson({
      engine: "google",
      q: query,
      api_key: process.env.SERPAPI_KEY,
    });

    res.json({
      success: true,
      query: query,
      results: searchResults.organic_results || [],
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
*/
// Shopping search route with multiple furniture items and total budget
app.post("/shopping-search", async (req, res) => {
  try {
    const { items, totalBudget = 5000 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    const results = await fetchShoppingResults(items);

    res.json({
      success: true,
      totalBudget,
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint for searching furniture based on AI-generated descriptions
app.post("/search-furniture", async (req, res) => {
  try {
    const { furniture } = req.body;

    if (!furniture || !Array.isArray(furniture) || furniture.length === 0) {
      return res.status(400).json({ error: "Furniture array is required" });
    }

    // Extract descriptions for SerpAPI search - use simpler search terms
    const searchQueries = furniture.map((item) => {
      // Use just the name for simpler searches, or extract key furniture terms
      const simpleQuery = item.name.toLowerCase();
      return simpleQuery;
    });

    console.log("Search queries:", searchQueries);

    // Use existing fetchShoppingResults function
    const searchResults = await fetchShoppingResults(searchQueries);

    console.log("Search results:", JSON.stringify(searchResults, null, 2));

    // Map the results back to the original furniture structure
    const furnitureWithResults = furniture.map((item, index) => ({
      ...item,
      searchResults: searchResults[index]?.results || [],
    }));

    res.json({
      success: true,
      furniture: furnitureWithResults,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for SerpAPI
app.post("/test-serp", async (req, res) => {
  try {
    const { query } = req.body;
    console.log("Testing SerpAPI with query:", query);

    const results = await fetchShoppingResults([query]);
    res.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error("SerpAPI test error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
