import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { fail, ok, parseJsonArray } from "../utils.js";

export const categoriesRouter = Router();

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value").optional()
});

function normalizeTagName(name: string) {
  return name.trim().toLowerCase();
}

function tagCounts() {
  const rows = db.prepare("SELECT tags FROM entries").all() as { tags: string | null }[];
  const counts = new Map<string, number>();
  rows.flatMap((row) => parseJsonArray(row.tags)).forEach((tag) => {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  });
  return counts;
}

categoriesRouter.get("/categories", (_req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT c.id, c.name as category, c.color, COUNT(e.id) as count
        FROM categories c
        LEFT JOIN entries e ON e.category = c.name
        GROUP BY c.id, c.name, c.color
        ORDER BY count DESC, c.name ASC
      `)
      .all() as { id: number; category: string; color: string; count: number }[];
    ok(res, rows);
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load categories");
  }
});

categoriesRouter.post("/categories", (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO categories (name, color, created_at) VALUES (?, ?, ?)").run(parsed.data.name, parsed.data.color ?? "#94a3b8", now);
    ok(res, { category: parsed.data.name, color: parsed.data.color ?? "#94a3b8", count: 0 }, 201);
  } catch (error) {
    fail(res, error instanceof Error && error.message.includes("UNIQUE") ? "Category already exists" : "Failed to create category", 400);
  }
});

categoriesRouter.put("/categories/:name", (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const oldName = req.params.name;
    const nextName = parsed.data.name;
    const update = db.transaction(() => {
      const result = parsed.data.color
        ? db.prepare("UPDATE categories SET name = ?, color = ? WHERE name = ?").run(nextName, parsed.data.color, oldName)
        : db.prepare("UPDATE categories SET name = ? WHERE name = ?").run(nextName, oldName);
      if (result.changes === 0) throw new Error("Category not found");
      db.prepare("UPDATE entries SET category = ?, updated_at = ? WHERE category = ?").run(nextName, new Date().toISOString(), oldName);
    });
    update();
    ok(res, { category: nextName, color: parsed.data.color });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    fail(res, message.includes("UNIQUE") ? "Category already exists" : message, message.includes("not found") ? 404 : 400);
  }
});

categoriesRouter.delete("/categories/:name", (req, res) => {
  try {
    const name = req.params.name;
    const remove = db.transaction(() => {
      const result = db.prepare("DELETE FROM categories WHERE name = ?").run(name);
      if (result.changes === 0) throw new Error("Category not found");
      db.prepare("UPDATE entries SET category = 'Other', updated_at = ? WHERE category = ?").run(new Date().toISOString(), name);
      db.prepare("INSERT OR IGNORE INTO categories (name, color, created_at) VALUES ('Other', '#94a3b8', ?)").run(new Date().toISOString());
    });
    remove();
    ok(res, { category: name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    fail(res, message, message.includes("not found") ? 404 : 400);
  }
});

categoriesRouter.get("/tags", (_req, res) => {
  try {
    const counts = tagCounts();
    const rows = db.prepare("SELECT id, name as tag FROM tags ORDER BY name ASC").all() as { id: number; tag: string }[];
    ok(
      res,
      rows
        .map((row) => ({ ...row, count: counts.get(row.tag) ?? 0 }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    );
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load tags");
  }
});

categoriesRouter.post("/tags", (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const tag = normalizeTagName(parsed.data.name);
    db.prepare("INSERT INTO tags (name, created_at) VALUES (?, ?)").run(tag, new Date().toISOString());
    ok(res, { tag, count: 0 }, 201);
  } catch (error) {
    fail(res, error instanceof Error && error.message.includes("UNIQUE") ? "Tag already exists" : "Failed to create tag", 400);
  }
});

categoriesRouter.put("/tags/:name", (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const oldName = normalizeTagName(req.params.name);
    const nextName = normalizeTagName(parsed.data.name);
    const update = db.transaction(() => {
      const result = db.prepare("UPDATE tags SET name = ? WHERE name = ?").run(nextName, oldName);
      if (result.changes === 0) throw new Error("Tag not found");
      const rows = db.prepare("SELECT id, tags FROM entries WHERE tags LIKE ?").all(`%"${oldName}"%`) as { id: number; tags: string | null }[];
      const updateEntry = db.prepare("UPDATE entries SET tags = ?, updated_at = ? WHERE id = ?");
      rows.forEach((row) => {
        const renamed = Array.from(new Set(parseJsonArray(row.tags).map((tag) => (tag === oldName ? nextName : tag))));
        updateEntry.run(JSON.stringify(renamed), new Date().toISOString(), row.id);
      });
    });
    update();
    ok(res, { tag: nextName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tag";
    fail(res, message.includes("UNIQUE") ? "Tag already exists" : message, message.includes("not found") ? 404 : 400);
  }
});

categoriesRouter.delete("/tags/:name", (req, res) => {
  try {
    const name = normalizeTagName(req.params.name);
    const remove = db.transaction(() => {
      const result = db.prepare("DELETE FROM tags WHERE name = ?").run(name);
      if (result.changes === 0) throw new Error("Tag not found");
      const rows = db.prepare("SELECT id, tags FROM entries WHERE tags LIKE ?").all(`%"${name}"%`) as { id: number; tags: string | null }[];
      const updateEntry = db.prepare("UPDATE entries SET tags = ?, updated_at = ? WHERE id = ?");
      rows.forEach((row) => {
        updateEntry.run(JSON.stringify(parseJsonArray(row.tags).filter((tag) => tag !== name)), new Date().toISOString(), row.id);
      });
    });
    remove();
    ok(res, { tag: name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tag";
    fail(res, message, message.includes("not found") ? 404 : 400);
  }
});
