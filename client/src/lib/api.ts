import type { CompleteTaskInput, CountedCategory, CountedTag, Entry, EntryInput, EntryList, LearningTask, Stats, TaskInput } from "../types";

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.success) throw new Error(payload.error);
  return payload.data;
}

export const api = {
  entries(params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    return request<EntryList>(`/api/entries?${query.toString()}`);
  },
  entry(id: string | number) {
    return request<Entry>(`/api/entries/${id}`);
  },
  createEntry(input: EntryInput) {
    return request<Entry>("/api/entries", { method: "POST", body: JSON.stringify(input) });
  },
  updateEntry(id: string | number, input: EntryInput) {
    return request<Entry>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(input) });
  },
  deleteEntry(id: string | number) {
    return request<{ id: number }>(`/api/entries/${id}`, { method: "DELETE" });
  },
  tasks(params: Record<string, string | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return request<LearningTask[]>(`/api/tasks?${query.toString()}`);
  },
  createTask(input: TaskInput) {
    return request<LearningTask>("/api/tasks", { method: "POST", body: JSON.stringify(input) });
  },
  updateTask(id: string | number, input: TaskInput) {
    return request<LearningTask>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(input) });
  },
  updateTaskStatus(id: string | number, status: "todo" | "doing") {
    return request<LearningTask>(`/api/tasks/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
  },
  completeTask(id: string | number, input: CompleteTaskInput) {
    return request<{ task: LearningTask; entry: Entry }>(`/api/tasks/${id}/complete`, { method: "POST", body: JSON.stringify(input) });
  },
  deleteTask(id: string | number) {
    return request<{ id: number }>(`/api/tasks/${id}`, { method: "DELETE" });
  },
  stats() {
    return request<Stats>("/api/stats");
  },
  categories() {
    return request<CountedCategory[]>("/api/categories");
  },
  createCategory(name: string, color = "#94a3b8") {
    return request<CountedCategory>("/api/categories", { method: "POST", body: JSON.stringify({ name, color }) });
  },
  updateCategory(name: string, nextName: string, color?: string) {
    return request<{ category: string; color?: string }>(`/api/categories/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify({ name: nextName, color }) });
  },
  deleteCategory(name: string) {
    return request<{ category: string }>(`/api/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
  },
  tags() {
    return request<CountedTag[]>("/api/tags");
  },
  createTag(name: string) {
    return request<CountedTag>("/api/tags", { method: "POST", body: JSON.stringify({ name }) });
  },
  updateTag(name: string, nextName: string) {
    return request<{ tag: string }>(`/api/tags/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify({ name: nextName }) });
  },
  deleteTag(name: string) {
    return request<{ tag: string }>(`/api/tags/${encodeURIComponent(name)}`, { method: "DELETE" });
  },
  dates() {
    return request<string[]>("/api/entries/dates");
  }
};
