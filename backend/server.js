// backend/server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// ── Gemini + SERP (your new code) ───────────────────────────────────────────────
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchShoppingResults } from "./serpServiceAPI.js"; // your module
import { getJson } from "serpapi"; // only used if you re-enable the commented route

// ── Gallery deps (from your old code) ──────────────────────────────────────────
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import db from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS + Body parsing
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ───────────────────────────────────────────────────────────────────────────────
// Cloudinary configuration (gallery)
// ───────────────────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ───────────────────────────────────────────────────────────────────────────────
// SQLite prepared statements (gallery)
// ───────────────────────────────────────────────────────────────────────────────
const insertImageStmt = db.prepare(`
  INSERT INTO images (public_id, url, original_filename, width, height, format, bytes, design_data)
  VALUES (@public_id, @url, @original_filename, @width, @height, @format, @bytes, @design_data)
`);
const listImagesStmt = db.prepare(`
  SELECT id, public_id, url, original_filename, width, height, format, bytes, design_data, created_at
  FROM images
  ORDER BY id DESC
  LIMIT @limit OFFSET @offset
`);
const countImagesStmt = db.prepare(`SELECT COUNT(*) AS c FROM images`);
const findImageByIdStmt = db.prepare(`SELECT * FROM images WHERE id = ?`);
const deleteImageStmt = db.prepare(`DELETE FROM images WHERE id = ?`);

// Multer (memory) for uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ───────────────────────────────────────────────────────────────────────────────
// Root
// ───────────────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "Server is running! (Gemini + SERP + Gallery)" });
});

// ───────────────────────────────────────────────────────────────────────────────
// Gemini routes (kept from new server.js)
// ───────────────────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/test-gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ success: true, response: response.text() });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// SERP routes (kept from new server.js)
// ───────────────────────────────────────────────────────────────────────────────
/*
// If you want the generic search route back, uncomment this block.
app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });
    const searchResults = await getJson({
      engine: "google",
      q: query,
      api_key: process.env.SERPAPI_KEY,
    });
    res.json({
      success: true,
      query,
      results: searchResults.organic_results || [],
    });
  } catch (error) {
    console.error("SERP /search error:", error);
    res.status(500).json({ error: error.message });
  }
});
*/

app.post("/shopping-search", async (req, res) => {
  try {
    const { items, totalBudget = 5000 } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }
    const results = await fetchShoppingResults(items);
    res.json({ success: true, totalBudget, results });
  } catch (error) {
    console.error("SERP /shopping-search error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/search-furniture", async (req, res) => {
  try {
    const { furniture } = req.body;
    if (!furniture || !Array.isArray(furniture) || furniture.length === 0) {
      return res.status(400).json({ error: "Furniture array is required" });
    }
    const searchQueries = furniture.map((item) =>
      (item?.name || "").toLowerCase()
    );
    const searchResults = await fetchShoppingResults(searchQueries);
    const furnitureWithResults = furniture.map((item, i) => ({
      ...item,
      searchResults: searchResults[i]?.results || [],
    }));
    res.json({ success: true, furniture: furnitureWithResults });
  } catch (error) {
    console.error("SERP /search-furniture error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/test-serp", async (req, res) => {
  try {
    const { query } = req.body;
    const results = await fetchShoppingResults([query]);
    res.json({ success: true, query, results });
  } catch (error) {
    console.error("SERP /test-serp error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Gallery routes (restored from old server.js)
// Base path: /api/gallery
// ───────────────────────────────────────────────────────────────────────────────

// Upload an image (Cloudinary + SQLite)
app.post("/api/gallery/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing 'image' file." });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "hackathon-gallery", resource_type: "image" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const row = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      original_filename:
        uploadResult.original_filename || req.file.originalname || null,
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      format: uploadResult.format || null,
      bytes: uploadResult.bytes || null,
      design_data: req.body.design_data || null,
    };

    const info = insertImageStmt.run(row);
    res.json({ ok: true, image: { id: info.lastInsertRowid, ...row } });
  } catch (e) {
    console.error("Gallery upload error:", e);
    res.status(500).json({ ok: false, error: e?.message || "Upload failed." });
  }
});

// List images (paginated)
app.get("/api/gallery", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(req.query.pageSize || "30", 10))
  );
  const offset = (page - 1) * pageSize;

  const images = listImagesStmt.all({ limit: pageSize, offset });
  const total = countImagesStmt.get().c;
  res.json({ ok: true, images, page, pageSize, total });
});

// Delete image (Cloudinary + SQLite)
app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "Invalid id." });

    const row = findImageByIdStmt.get(id);
    if (!row) return res.status(404).json({ ok: false, error: "Not found." });

    await cloudinary.uploader.destroy(row.public_id, {
      resource_type: "image",
    });
    deleteImageStmt.run(id);
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete image error:", e);
    res.status(500).json({ ok: false, error: e?.message || "Delete failed." });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Start
// ───────────────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
