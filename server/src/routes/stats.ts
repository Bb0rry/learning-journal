import { Router } from "express";
import { addDays, differenceInCalendarDays, format, isValid, parse, startOfDay, subDays } from "date-fns";
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

function resolveMonth(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  const parsed = raw ? parse(raw, "yyyy-MM", new Date()) : new Date();
  const date = isValid(parsed) ? parsed : new Date();
  return {
    month: format(date, "yyyy-MM"),
    start: `${format(date, "yyyy-MM")}-01`
  };
}

statsRouter.get("/", (req, res) => {
  try {
    const selectedMonth = resolveMonth(req.query.month);
    const monthStart = new Date(`${selectedMonth.start}T00:00:00.000Z`);
    const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
    const daysInMonth = differenceInCalendarDays(nextMonth, monthStart);
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
        WHERE date(created_at) >= date(@monthStart)
          AND date(created_at) < date(@nextMonth)
        ORDER BY created_at DESC
      `)
      .all({ monthStart: selectedMonth.start, nextMonth: format(nextMonth, "yyyy-MM-dd") }) as { id: number; title: string; category: string | null; duration_minutes: number | null; date: string }[];
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
    const heatmap = Array.from({ length: daysInMonth }, (_, index) => {
      const date = format(addDays(monthStart, index), "yyyy-MM-dd");
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
      heatmapMonth: selectedMonth.month,
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
