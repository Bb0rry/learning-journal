import { Router } from "express";
import { z } from "zod";
import { db, mapEntry, mapTask, type EntryRow, type TaskRow } from "../db.js";
import { fail, normalizeTags, ok } from "../utils.js";

export const tasksRouter = Router();

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default("Other"),
  tags: z.array(z.string()).optional().default([]),
  source_url: z.string().trim().url().optional().or(z.literal("")).default("")
});

const completeSchema = z.object({
  content: z.string().trim().min(1, "Notes are required"),
  duration_minutes: z.number().int().min(0),
  category: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  source_url: z.string().trim().url().optional().or(z.literal(""))
});

function syncMetadata(category: string, tags: string[], now: string) {
  db.prepare("INSERT OR IGNORE INTO categories (name, color, created_at) VALUES (?, '#94a3b8', ?)").run(category || "Other", now);
  tags.forEach((tag) => db.prepare("INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)").run(tag.trim().toLowerCase(), now));
}

tasksRouter.get("/", (req, res) => {
  try {
    const status = String(req.query.status ?? "");
    const rows = status
      ? (db.prepare("SELECT * FROM tasks WHERE status = ? ORDER BY planned_at DESC, id DESC").all(status) as TaskRow[])
      : (db.prepare("SELECT * FROM tasks ORDER BY CASE status WHEN 'doing' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END, planned_at DESC, id DESC").all() as TaskRow[]);
    ok(res, rows.map(mapTask));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load tasks");
  }
});

tasksRouter.post("/", (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const now = new Date().toISOString();
    const tags = parsed.data.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    const category = parsed.data.category || "Other";
    const result = db.prepare(`
      INSERT INTO tasks (title, description, category, tags, source_url, status, planned_at, created_at, updated_at)
      VALUES (@title, @description, @category, @tags, @source_url, 'todo', @planned_at, @created_at, @updated_at)
    `).run({
      title: parsed.data.title,
      description: parsed.data.description,
      category,
      tags: JSON.stringify(Array.from(new Set(tags))),
      source_url: parsed.data.source_url || "",
      planned_at: now,
      created_at: now,
      updated_at: now
    });
    syncMetadata(category, tags, now);
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid) as TaskRow;
    ok(res, mapTask(row), 201);
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to create task");
  }
});

tasksRouter.put("/:id", (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow | undefined;
    if (!existing) return fail(res, "Task not found", 404);
    if (existing.status === "completed") return fail(res, "Completed tasks cannot be edited here", 400);
    const now = new Date().toISOString();
    const tags = parsed.data.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    const category = parsed.data.category || "Other";
    db.prepare(`
      UPDATE tasks
      SET title = @title, description = @description, category = @category, tags = @tags, source_url = @source_url, updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: req.params.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category,
      tags: JSON.stringify(Array.from(new Set(tags))),
      source_url: parsed.data.source_url || "",
      updated_at: now
    });
    syncMetadata(category, tags, now);
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow;
    ok(res, mapTask(row));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to update task");
  }
});

tasksRouter.put("/:id/status", (req, res) => {
  const parsed = z.object({ status: z.enum(["todo", "doing"]) }).safeParse(req.body);
  if (!parsed.success) return fail(res, "Invalid status", 400);

  try {
    const result = db.prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ? AND status != 'completed'").run(parsed.data.status, new Date().toISOString(), req.params.id);
    if (result.changes === 0) return fail(res, "Task not found", 404);
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow;
    ok(res, mapTask(row));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to update task status");
  }
});

tasksRouter.post("/:id/complete", (req, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const complete = db.transaction(() => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as TaskRow | undefined;
      if (!task) throw new Error("Task not found");
      if (task.status === "completed") throw new Error("Task already completed");
      const now = new Date().toISOString();
      const category = parsed.data.category || task.category || "Other";
      const tags = parsed.data.tags ?? (task.tags ? JSON.parse(task.tags) : []);
      const sourceUrl = parsed.data.source_url ?? task.source_url ?? "";
      const entryResult = db.prepare(`
        INSERT INTO entries (title, content, category, tags, duration_minutes, source_url, created_at, updated_at)
        VALUES (@title, @content, @category, @tags, @duration_minutes, @source_url, @created_at, @updated_at)
      `).run({
        title: task.title,
        content: parsed.data.content,
        category,
        tags: normalizeTags(tags),
        duration_minutes: parsed.data.duration_minutes,
        source_url: sourceUrl,
        created_at: now,
        updated_at: now
      });
      db.prepare("UPDATE tasks SET status = 'completed', completed_at = ?, entry_id = ?, updated_at = ? WHERE id = ?").run(now, entryResult.lastInsertRowid, now, task.id);
      syncMetadata(category, tags, now);
      const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id) as TaskRow;
      const entry = db.prepare("SELECT * FROM entries WHERE id = ?").get(entryResult.lastInsertRowid) as EntryRow;
      return { task: mapTask(updatedTask), entry: mapEntry(entry) };
    });
    ok(res, complete());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete task";
    fail(res, message, message.includes("not found") ? 404 : 400);
  }
});

tasksRouter.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return fail(res, "Task not found", 404);
    ok(res, { id: Number(req.params.id) });
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to delete task");
  }
});
