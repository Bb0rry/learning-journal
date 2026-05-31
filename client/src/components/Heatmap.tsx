import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { useLanguage } from "../lib/i18n";
import { cn } from "../lib/utils";
import type { Stats } from "../types";

export function Heatmap({ data }: { data: Stats["heatmap"] }) {
  const { t } = useLanguage();
  const max = Math.max(1, ...data.map((item) => item.minutes));
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-950 dark:text-white">{t("heatmapTitle")}</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t("heatmapRange")}</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {data.map((item) => {
          const level = item.minutes === 0 ? 0 : Math.ceil((item.minutes / max) * 4);
          return (
            <div
              key={item.date}
              tabIndex={0}
              className={cn(
                "group relative aspect-square rounded-md border transition hover:z-10 hover:scale-110 focus:z-10 focus:scale-110",
                level === 0 && "border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5",
                level === 1 && "border-emerald-300/30 bg-emerald-300/25",
                level === 2 && "border-emerald-300/40 bg-emerald-400/45",
                level === 3 && "border-emerald-300/50 bg-emerald-400/70",
                level === 4 && "border-amber-200/60 bg-amber-300"
              )}
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl group-hover:block group-focus:block dark:border-white/10 dark:bg-slate-950">
                <div className="text-sm font-bold text-slate-950 dark:text-white">{format(parseISO(item.date), "MMM d, yyyy")}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.entries.length ? `${t("heatmapEntries", { count: item.entries.length })} · ${t("heatmapMinutes", { count: item.minutes })}` : t("heatmapEmpty")}
                </div>
                {item.entries.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {item.entries.slice(0, 4).map((entry) => (
                      <Link key={entry.id} to={`/entry/${entry.id}`} className="pointer-events-auto block rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-100 dark:bg-white/10 dark:text-slate-200">
                        {entry.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
