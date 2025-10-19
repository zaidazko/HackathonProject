// backend/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// ensure data dir
const dataDir = path.join(dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'gallery.db');
const db = new Database(dbPath);

// Create table if not exists
db.exec(
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    original_filename TEXT,
    width INTEGER,
    height INTEGER,
    format TEXT,
    bytes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
);

export default db;