import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "learning-journal.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export type EntryRow = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  duration_minutes: number | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  tags: string | null;
  source_url: string | null;
  status: "todo" | "doing" | "completed";
  planned_at: string;
  completed_at: string | null;
  entry_id: number | null;
  created_at: string;
  updated_at: string;
};

const sampleTitles = [
  "React query cache invalidation patterns",
  "SQLite indexing for fast local apps",
  "Tailwind dark mode theming",
  "Express route validation with Zod",
  "Accessible command palettes",
  "Docker image layer caching",
  "Prompt evaluation basics",
  "OAuth refresh token rotation",
  "TypeScript discriminated unions",
  "CSS container queries",
  "Node stream backpressure",
  "GitHub Actions matrix builds",
  "Threat modeling with STRIDE",
  "RAG chunking tradeoffs",
  "Form validation ergonomics",
  "SQL full text search ideas",
  "React Router loaders vs client state",
  "Secure headers with Helmet"
];

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      duration_minutes INTEGER,
      source_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#94a3b8',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      tags TEXT,
      source_url TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      planned_at TEXT NOT NULL,
      completed_at TEXT,
      entry_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(entry_id) REFERENCES entries(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_planned_at ON tasks(planned_at DESC);
  `);

  const categoryColumns = db.prepare("PRAGMA table_info(categories)").all() as { name: string }[];
  if (!categoryColumns.some((column) => column.name === "color")) {
    db.prepare("ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '#94a3b8'").run();
  }

  const cleanupSamples = db.transaction(() => {
    const deleteSample = db.prepare(`
      DELETE FROM entries
      WHERE title = ?
        AND content LIKE '%Key idea: capture the smallest useful mental model%'
        AND content LIKE '%Follow-up: revisit this topic%'
    `);
    sampleTitles.forEach((title) => deleteSample.run(title));
  });

  cleanupSamples();
  syncMetadataFromEntries();
}

export function syncMetadataFromEntries() {
  const now = new Date().toISOString();
  const categoryRows = db.prepare("SELECT DISTINCT category FROM entries WHERE category IS NOT NULL AND trim(category) != ''").all() as { category: string }[];
  const tagRows = db.prepare("SELECT tags FROM entries WHERE tags IS NOT NULL AND trim(tags) != ''").all() as { tags: string }[];
  const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name, color, created_at) VALUES (?, ?, ?)");
  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)");

  const defaults: Record<string, string> = {
    Frontend: "#38bdf8",
    Backend: "#34d399",
    DevOps: "#fbbf24",
    "AI/ML": "#a78bfa",
    Security: "#fb7185",
    Other: "#94a3b8"
  };
  Object.entries(defaults).forEach(([category, color]) => insertCategory.run(category, color, now));
  categoryRows.forEach((row) => insertCategory.run(row.category, defaults[row.category] ?? "#94a3b8", now));
  tagRows.forEach((row) => {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        parsed.filter((tag) => typeof tag === "string" && tag.trim()).forEach((tag) => insertTag.run(tag.trim().toLowerCase(), now));
      }
    } catch {
      // Ignore malformed historical tag data.
    }
  });
}

export function mapEntry(row: EntryRow) {
  return {
    ...row,
    category: row.category ?? "Other",
    tags: row.tags ? JSON.parse(row.tags) : [],
    duration_minutes: row.duration_minutes ?? 0,
    source_url: row.source_url ?? ""
  };
}

export function mapTask(row: TaskRow) {
  return {
    ...row,
    description: row.description ?? "",
    category: row.category ?? "Other",
    tags: row.tags ? JSON.parse(row.tags) : [],
    source_url: row.source_url ?? "",
    completed_at: row.completed_at ?? "",
    entry_id: row.entry_id ?? null
  };
}
