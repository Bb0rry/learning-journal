import { useQuery } from "@tanstack/react-query";
import { addMonths, format, parse } from "date-fns";
import { Clock, Flame, Library, Timer } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EntryCard } from "../components/EntryCard";
import { Heatmap } from "../components/Heatmap";
import { Skeleton } from "../components/ui/skeleton";
import { StatsCard } from "../components/StatsCard";
import { TagCloud } from "../components/TagCloud";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { minutesToLabel } from "../lib/utils";
import { useStats } from "../hooks/useStats";

const chartColors = ["#34d399", "#a78bfa", "#fbbf24", "#fb7185", "#38bdf8", "#94a3b8"];

export function Dashboard() {
  const { t } = useLanguage();
  const [heatmapMonth, setHeatmapMonth] = useState(format(new Date(), "yyyy-MM"));
  const stats = useStats(heatmapMonth);
  const recent = useQuery({ queryKey: ["entries", "recent"], queryFn: () => api.entries({ page: 1, limit: 5 }) });
  const parsedHeatmapMonth = parse(heatmapMonth, "yyyy-MM", new Date());

  if (stats.isLoading || recent.isLoading) {
    return <DashboardSkeleton />;
  }
  if (stats.isError || recent.isError || !stats.data || !recent.data) {
    return <p className="glass rounded-xl p-6 text-rose-500">{t("failedDashboard")}</p>;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">{t("dailyTracker")}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-normal text-slate-950 dark:text-white md:text-5xl">
            {t("dashboardTitlePrefix")} <span className="gradient-text">{t("dashboardTitleAccent")}</span>
          </h1>
        </div>
        <div className="glass flex items-center gap-3 rounded-xl px-5 py-4">
          <Flame className="animate-pulse text-amber-400" />
          <span className="text-lg font-extrabold">{t("currentStreak", { count: stats.data.currentStreak })}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label={t("thisWeek")} value={minutesToLabel(stats.data.weekMinutes)} icon={Timer} />
        <StatsCard label={t("thisMonth")} value={minutesToLabel(stats.data.monthMinutes)} icon={Clock} accent="violet" />
        <StatsCard label={t("allTime")} value={minutesToLabel(stats.data.totalMinutes)} icon={Flame} accent="amber" />
        <StatsCard label={t("entries")} value={String(stats.data.totalEntries)} icon={Library} accent="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setHeatmapMonth(format(addMonths(parsedHeatmapMonth, -1), "yyyy-MM"))}>
                {t("previousMonth")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setHeatmapMonth(format(new Date(), "yyyy-MM"))}>
                {t("currentMonth")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setHeatmapMonth(format(addMonths(parsedHeatmapMonth, 1), "yyyy-MM"))}>
                {t("nextMonth")}
              </Button>
            </div>
            <Input className="w-40" type="month" value={heatmapMonth} onChange={(event) => setHeatmapMonth(event.target.value)} />
          </div>
          <Heatmap data={stats.data.heatmap} monthLabel={format(parsedHeatmapMonth, "MMMM yyyy")} />
        </div>
        <div className="glass rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-slate-950 dark:text-white">{t("categoryMix")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.data.categoryBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={0} stroke="none">
                  {stats.data.categoryBreakdown.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t("recentEntries")}</h2>
          </div>
          {recent.data.items.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recent.data.items.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
            </div>
          ) : (
            <p className="glass rounded-xl p-6 text-slate-500">{t("noEntries")}</p>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <h2 className="mb-4 font-semibold text-slate-950 dark:text-white">{t("tagCloud")}</h2>
          <TagCloud tags={stats.data.tagCloud} />
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24" />
      <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      <div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
    </div>
  );
}
