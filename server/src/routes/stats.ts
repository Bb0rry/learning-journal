import { Router } from "express";
import { differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import { db } from "../db.js";
import { fail, ok, parseJsonArray } from "../utils.js";

export const statsRouter = Router();

function currentStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  let cursor = startOfDay(new Date());

  if (!set.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = subDays(cursor, 1);
  }

  while (set.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

statsRouter.get("/", (_req, res) => {
  try {
    const summary = db.prepare(`
      SELECT
        COUNT(*) as totalEntries,
        COALESCE(SUM(duration_minutes), 0) as totalMinutes,
        COALESCE(SUM(CASE WHEN date(created_at) >= date('now', '-6 days') THEN duration_minutes ELSE 0 END), 0) as weekMinutes,
        COALESCE(SUM(CASE WHEN date(created_at) >= date('now', '-29 days') THEN duration_minutes ELSE 0 END), 0) as monthMinutes
      FROM entries
    `).get() as {
      totalEntries: number;
      totalMinutes: number;
      weekMinutes: number;
      monthMinutes: number;
    };

    const categoryBreakdown = db
      .prepare("SELECT category as name, COUNT(*) as value FROM entries GROUP BY category ORDER BY value DESC")
      .all() as { name: string | null; value: number }[];

    const tagRows = db.prepare("SELECT tags FROM entries").all() as { tags: string | null }[];
    const tagCounts = new Map<string, number>();
    tagRows.flatMap((row) => parseJsonArray(row.tags)).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });

    const dateRows = db
      .prepare("SELECT substr(created_at, 1, 10) as date, COUNT(*) as count, SUM(duration_minutes) as minutes FROM entries GROUP BY date")
      .all() as { date: string; count: number; minutes: number }[];
    const dateMap = new Map(dateRows.map((row) => [row.date, row]));
    const heatmapEntryRows = db
      .prepare(`
        SELECT id, title, category, duration_minutes, substr(created_at, 1, 10) as date
        FROM entries
        WHERE date(created_at) >= date('now', '-34 days')
        ORDER BY created_at DESC
      `)
      .all() as { id: number; title: string; category: string | null; duration_minutes: number | null; date: string }[];
    const entriesByDate = heatmapEntryRows.reduce<Record<string, { id: number; title: string; category: string; duration_minutes: number }[]>>(
      (acc, entry) => {
        acc[entry.date] = [
          ...(acc[entry.date] ?? []),
          {
            id: entry.id,
            title: entry.title,
            category: entry.category ?? "Other",
            duration_minutes: entry.duration_minutes ?? 0
          }
        ];
        return acc;
      },
      {}
    );
    const heatmap = Array.from({ length: 35 }, (_, index) => {
      const date = format(subDays(new Date(), 34 - index), "yyyy-MM-dd");
      return {
        date,
        count: dateMap.get(date)?.count ?? 0,
        minutes: dateMap.get(date)?.minutes ?? 0,
        entries: entriesByDate[date] ?? []
      };
    });

    const activeDates = dateRows
      .map((row) => row.date)
      .sort((a, b) => differenceInCalendarDays(new Date(b), new Date(a)));

    ok(res, {
      ...summary,
      currentStreak: currentStreak(activeDates),
      categoryBreakdown: categoryBreakdown.map((item) => ({ name: item.name ?? "Other", value: item.value })),
      tagCloud: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 24),
      heatmap
    });
  } catch (error) {
    fail(res, error instanceof Error ? error.message : "Failed to load stats");
  }
});
