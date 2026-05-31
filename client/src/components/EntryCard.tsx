import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { minutesToLabel } from "../lib/utils";
import type { Entry } from "../types";

export function EntryCard({ entry, compact = false, titleOverride }: { entry: Entry; compact?: boolean; titleOverride?: React.ReactNode }) {
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories, staleTime: 60_000 });
  const color = categories.data?.find((item) => item.category === entry.category)?.color ?? "#94a3b8";

  return (
    <Link
      to={`/entry/${entry.id}`}
      className="glass group block rounded-xl p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {entry.category}
            <span>•</span>
            {format(new Date(entry.created_at), "MMM d, yyyy")}
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-950 transition group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-300">
            {titleOverride ?? entry.title}
          </h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/12 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-200">
          <Clock size={14} />
          {minutesToLabel(entry.duration_minutes)}
        </span>
      </div>
      {!compact && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{entry.content.replace(/[#*_`>-]/g, "")}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {entry.tags.slice(0, 5).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
            #{tag}
          </span>
        ))}
        {entry.source_url && <ExternalLink size={14} className="ml-auto text-slate-400" />}
      </div>
    </Link>
  );
}
