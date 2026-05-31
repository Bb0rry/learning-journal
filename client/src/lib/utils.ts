import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

export const categoryColors: Record<string, string> = {
  Frontend: "bg-sky-400",
  Backend: "bg-emerald-400",
  DevOps: "bg-amber-400",
  "AI/ML": "bg-violet-400",
  Security: "bg-rose-400",
  Other: "bg-slate-400"
};
