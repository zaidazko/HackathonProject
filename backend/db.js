// backend/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data.sqlite");

// Make sure folder exists (optional if you store elsewhere)
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL,
    url TEXT NOT NULL,
    original_filename TEXT,
    width INTEGER,
    height INTEGER,
    format TEXT,
    bytes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_images_created_at ON images (created_at DESC);
`);

export default db;
