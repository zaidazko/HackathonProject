import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getJson } from "serpapi";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend communication
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite default frontend port
      "http://localhost:3000", // Backend port (for testing)
      "http://127.0.0.1:5173", // Alternative localhost format
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

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

// Furniture Generation Endpoint: Form data -> Gemini generates image + furniture list -> Create search queries
app.post("/generate-furniture", async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({ error: "Form data is required" });
    }

    // Step 1: Use Gemini to generate image description and detailed furniture list
    const furniturePrompt = `Based on this form data, generate:
    1. A detailed image description for a room/space
    2. A JSON list of detailed furniture items needed
    
    Form data: ${JSON.stringify(formData)}
    
    Return in this exact format:
    IMAGE_DESCRIPTION: [your image description here]
    FURNITURE_JSON: [valid JSON array of furniture objects with properties like name, type, material, color, dimensions, etc.]
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const furnitureResult = await model.generateContent(furniturePrompt);
    const furnitureResponse = await furnitureResult.response.text();

    // Parse the response to extract image description and furniture JSON
    const imageMatch = furnitureResponse.match(
      /IMAGE_DESCRIPTION:\s*(.+?)(?=FURNITURE_JSON:|$)/s
    );
    const furnitureMatch = furnitureResponse.match(/FURNITURE_JSON:\s*(.+?)$/s);

    const imageDescription = imageMatch
      ? imageMatch[1].trim()
      : "No image description generated";
    let furnitureList = [];

    if (furnitureMatch) {
      try {
        furnitureList = JSON.parse(furnitureMatch[1].trim());
      } catch (parseError) {
        console.error("Error parsing furniture JSON:", parseError);
        furnitureList = [];
      }
    }

    // Step 2: Generate search queries for each furniture item
    const searchQueries = [];
    for (const furniture of furnitureList) {
      const queryPrompt = `Create an optimized search query for finding this furniture item online: ${JSON.stringify(
        furniture
      )}`;
      const queryResult = await model.generateContent(queryPrompt);
      const searchQuery = await queryResult.response.text();

      searchQueries.push({
        furniture: furniture,
        searchQuery: searchQuery.trim(),
      });
    }

    // Step 3: Return results
    res.json({
      success: true,
      originalFormData: formData,
      imageDescription: imageDescription,
      furnitureList: furnitureList,
      searchQueries: searchQueries,
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
