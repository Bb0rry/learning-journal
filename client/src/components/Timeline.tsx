import { format } from "date-fns";
import { EntryCard } from "./EntryCard";
import type { Entry } from "../types";

export function Timeline({ entries }: { entries: Entry[] }) {
  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const key = format(new Date(entry.created_at), "yyyy-MM-dd");
    acc[key] = [...(acc[key] ?? []), entry];
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, items]) => (
        <section key={date} className="relative border-l border-slate-200 pl-5 dark:border-white/10">
          <div className="sticky top-20 z-10 mb-4 w-fit rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-700 backdrop-blur dark:text-emerald-200">
            {format(new Date(date), "EEEE, MMMM d")}
          </div>
          <div className="space-y-4">
            {items.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
