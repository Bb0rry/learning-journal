import { Router } from "express";
import { z } from "zod";
import { db, mapDailySummary, type DailySummaryRow } from "../db.js";
import { fail, ok, toInt } from "../utils.js";

export const dailySummariesRouter = Router();

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const summarySchema = z.object({
  content: z.string().trim().min(1, "Summary is required")
});

dailySummariesRouter.get("/", (req, res) => {
  try {
    const limit = toInt(req.query.limit, 30, 1, 100);
    const rows = db.prepare("SELECT * FROM daily_summaries ORDER BY date DESC LIMIT ?").all(limit) as DailySummaryRow[];
    ok(res, rows.map(mapDailySummary));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load daily summaries");
  }
});

dailySummariesRouter.get("/:date", (req, res) => {
  const parsedDate = dateSchema.safeParse(req.params.date);
  if (!parsedDate.success) return fail(res, "Invalid date", 400);

  try {
    const row = db.prepare("SELECT * FROM daily_summaries WHERE date = ?").get(parsedDate.data) as DailySummaryRow | undefined;
    ok(res, row ? mapDailySummary(row) : null);
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load daily summary");
  }
});

dailySummariesRouter.put("/:date", (req, res) => {
  const parsedDate = dateSchema.safeParse(req.params.date);
  const parsedBody = summarySchema.safeParse(req.body);
  if (!parsedDate.success) return fail(res, "Invalid date", 400);
  if (!parsedBody.success) return fail(res, parsedBody.error.errors[0]?.message ?? "Invalid input", 400);

  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO daily_summaries (date, content, created_at, updated_at)
      VALUES (@date, @content, @created_at, @updated_at)
      ON CONFLICT(date) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
    `).run({
      date: parsedDate.data,
      content: parsedBody.data.content,
      created_at: now,
      updated_at: now
    });
    const row = db.prepare("SELECT * FROM daily_summaries WHERE date = ?").get(parsedDate.data) as DailySummaryRow;
    ok(res, mapDailySummary(row));
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to save daily summary");
  }
});

dailySummariesRouter.delete("/:date", (req, res) => {
  const parsedDate = dateSchema.safeParse(req.params.date);
  if (!parsedDate.success) return fail(res, "Invalid date", 400);

  try {
    db.prepare("DELETE FROM daily_summaries WHERE date = ?").run(parsedDate.data);
    ok(res, { date: parsedDate.data });
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to delete daily summary");
  }
});
