import { Router } from "express";
import { db, mapEntry, type EntryRow } from "../db.js";
import { entryInputSchema, fail, normalizeTags, ok, resolveLearnedAt, toInt } from "../utils.js";

export const entriesRouter = Router();

entriesRouter.get("/dates", (_req, res) => {
  try {
    const rows = db
      .prepare("SELECT DISTINCT substr(created_at, 1, 10) as date FROM entries ORDER BY date DESC")
      .all() as { date: string }[];
    ok(res, rows.map((row) => row.date));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load dates");
  }
});

entriesRouter.get("/", (req, res) => {
  try {
    const page = toInt(req.query.page, 1, 1, 10000);
    const limit = toInt(req.query.limit, 10, 1, 50);
    const offset = (page - 1) * limit;
    const sort = String(req.query.sort ?? "newest");
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (req.query.search) {
      clauses.push("(title LIKE @search OR summary LIKE @search OR content LIKE @search)");
      params.search = `%${String(req.query.search)}%`;
    }
    if (req.query.category) {
      clauses.push("category = @category");
      params.category = String(req.query.category);
    }
    if (req.query.tag) {
      clauses.push("tags LIKE @tag");
      params.tag = `%"${String(req.query.tag).toLowerCase()}"%`;
    }
    if (req.query.from) {
      clauses.push("date(created_at) >= date(@from)");
      params.from = String(req.query.from);
    }
    if (req.query.to) {
      clauses.push("date(created_at) <= date(@to)");
      params.to = String(req.query.to);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const orderBy =
      sort === "oldest"
        ? "created_at ASC"
        : sort === "duration"
          ? "duration_minutes DESC, created_at DESC"
          : "created_at DESC";

    const total = db.prepare(`SELECT COUNT(*) as count FROM entries ${where}`).get(params) as {
      count: number;
    };
    const rows = db
      .prepare(`SELECT * FROM entries ${where} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit, offset }) as EntryRow[];

    ok(res, {
      items: rows.map(mapEntry),
      page,
      limit,
      total: total.count,
      hasMore: offset + rows.length < total.count
    });
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load entries");
  }
});

entriesRouter.get("/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id) as EntryRow | undefined;
    if (!row) return fail(res, "Entry not found", 404);
    ok(res, mapEntry(row));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load entry");
  }
});

entriesRouter.post("/", (req, res) => {
  const parsed = entryInputSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const now = new Date().toISOString();
    const learnedAt = resolveLearnedAt(parsed.data.learned_at);
    const result = db
      .prepare(`
        INSERT INTO entries (title, summary, content, category, tags, duration_minutes, source_url, created_at, updated_at)
        VALUES (@title, @summary, @content, @category, @tags, @duration_minutes, @source_url, @created_at, @updated_at)
      `)
      .run({
        ...parsed.data,
        category: parsed.data.category || "Other",
        tags: normalizeTags(parsed.data.tags),
        source_url: parsed.data.source_url || "",
        created_at: learnedAt,
        updated_at: now
      });
    db.prepare("INSERT OR IGNORE INTO categories (name, color, created_at) VALUES (?, '#94a3b8', ?)").run(parsed.data.category || "Other", now);
    parsed.data.tags.forEach((tag) => db.prepare("INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)").run(tag.trim().toLowerCase(), now));
    const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(result.lastInsertRowid) as EntryRow;
    ok(res, mapEntry(row), 201);
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to create entry");
  }
});

entriesRouter.put("/:id", (req, res) => {
  const parsed = entryInputSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const existing = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id);
    if (!existing) return fail(res, "Entry not found", 404);

    const now = new Date().toISOString();
    const learnedAt = resolveLearnedAt(parsed.data.learned_at);
    db.prepare(`
      UPDATE entries
      SET title = @title,
          summary = @summary,
          content = @content,
          category = @category,
          tags = @tags,
          duration_minutes = @duration_minutes,
          source_url = @source_url,
          created_at = @created_at,
          updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: req.params.id,
      ...parsed.data,
      category: parsed.data.category || "Other",
      tags: normalizeTags(parsed.data.tags),
      source_url: parsed.data.source_url || "",
      created_at: learnedAt,
      updated_at: now
    });
    db.prepare("INSERT OR IGNORE INTO categories (name, color, created_at) VALUES (?, '#94a3b8', ?)").run(parsed.data.category || "Other", now);
    parsed.data.tags.forEach((tag) => db.prepare("INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)").run(tag.trim().toLowerCase(), now));

    const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id) as EntryRow;
    ok(res, mapEntry(row));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to update entry");
  }
});

entriesRouter.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM entries WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return fail(res, "Entry not found", 404);
    ok(res, { id: Number(req.params.id) });
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to delete entry");
  }
});
