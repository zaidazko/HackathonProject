import dotenv from "dotenv";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getJson } from "serpapi";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
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

// Simple SerpAPI search route
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
