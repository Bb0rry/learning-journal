export type Entry = {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  duration_minutes: number;
  source_url: string;
  created_at: string;
  updated_at: string;
};

export type EntryInput = {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  duration_minutes: number;
  source_url: string;
  learned_at: string;
};

export type EntryList = {
  items: Entry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type LearningTask = {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  source_url: string;
  status: "todo" | "doing" | "completed";
  planned_at: string;
  completed_at: string;
  entry_id: number | null;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  source_url: string;
};

export type CompleteTaskInput = {
  content: string;
  duration_minutes: number;
  category?: string;
  tags?: string[];
  source_url?: string;
  learned_at: string;
};

export type DailySummary = {
  id: number;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Stats = {
  totalEntries: number;
  totalMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  heatmapMonth: string;
  currentStreak: number;
  categoryBreakdown: { name: string; value: number }[];
  tagCloud: { tag: string; count: number }[];
  heatmap: {
    date: string;
    count: number;
    minutes: number;
    entries: { id: number; title: string; category: string; duration_minutes: number }[];
  }[];
};

export type CountedCategory = { id?: number; category: string; color: string; count: number };
export type CountedTag = { id?: number; tag: string; count: number };
