import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export function StatsCard({
  label,
  value,
  icon: Icon,
  accent = "emerald"
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "emerald" | "violet" | "amber" | "rose";
}) {
  const colors = {
    emerald: "text-emerald-400 bg-emerald-400/12",
    violet: "text-violet-400 bg-violet-400/12",
    amber: "text-amber-400 bg-amber-400/12",
    rose: "text-rose-400 bg-rose-400/12"
  };
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={cn("rounded-lg p-2", colors[accent])}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
