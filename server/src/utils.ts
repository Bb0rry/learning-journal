import type { Response } from "express";
import { z } from "zod";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data } satisfies ApiResponse<T>);
}

export function fail(res: Response, error: string, status = 500) {
  return res.status(status).json({ success: false, error } satisfies ApiResponse<never>);
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function normalizeTags(tags: string[] | undefined): string {
  const clean = Array.from(
    new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))
  );
  return JSON.stringify(clean);
}

export function toInt(value: unknown, fallback: number, min = 1, max = 100) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export const entryInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  summary: z.string().trim().optional().default(""),
  content: z.string().trim().min(1, "Content is required"),
  category: z.string().trim().optional().default("Other"),
  tags: z.array(z.string()).optional().default([]),
  duration_minutes: z.number().int().min(0).optional().default(0),
  source_url: z.string().trim().url().optional().or(z.literal("")).default(""),
  learned_at: z.string().trim().optional().default("")
});

export function resolveLearnedAt(value: string | undefined) {
  if (!value) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00.000Z`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
