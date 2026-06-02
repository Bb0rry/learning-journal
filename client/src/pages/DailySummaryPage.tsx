import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Input, Textarea } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";

export function DailySummaryPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const summaries = useQuery({ queryKey: ["daily-summaries"], queryFn: () => api.dailySummaries(60) });
  const current = useQuery({ queryKey: ["daily-summary", date], queryFn: () => api.dailySummary(date), enabled: Boolean(date) });

  useEffect(() => {
    setContent(current.data?.content ?? "");
  }, [current.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["daily-summaries"] });
    queryClient.invalidateQueries({ queryKey: ["daily-summary", date] });
  };

  const save = useMutation({
    mutationFn: () => api.saveDailySummary(date, content.trim()),
    onSuccess: () => {
      toast.success(t("dailySummarySaved"));
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const remove = useMutation({
    mutationFn: (targetDate: string) => api.deleteDailySummary(targetDate),
    onSuccess: () => {
      toast.success(t("dailySummaryDeleted"));
      setContent("");
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      toast.error(t("dailySummaryRequired"));
      return;
    }
    save.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">{t("dailySummary")}</p>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("dailySummaryTitle")}</h1>
        <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">{t("dailySummarySubtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} className="glass rounded-xl p-5">
          <div className="space-y-4">
            <div className="max-w-xs">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("summaryDate")}</label>
              <Input className="mt-2" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("dailySummary")}</label>
              <Textarea className="mt-2 min-h-64" value={content} onChange={(event) => setContent(event.target.value)} placeholder={t("dailySummaryLongPlaceholder")} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={save.isPending}>
                <Save size={18} /> {t("saveSummary")}
              </Button>
              <Button type="button" variant="danger" disabled={!current.data} onClick={() => window.confirm(t("deleteSummaryConfirm")) && remove.mutate(date)}>
                <Trash2 size={18} /> {t("delete")}
              </Button>
            </div>
          </div>
        </form>

        <aside className="glass h-fit rounded-xl p-5">
          <h2 className="font-extrabold text-slate-950 dark:text-white">{t("recentSummaries")}</h2>
          <div className="mt-4 space-y-3">
            {summaries.isLoading && <Skeleton className="h-40" />}
            {summaries.data?.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t("noDailySummaries")}</p>}
            {summaries.data?.map((summary) => (
              <button
                key={summary.date}
                type="button"
                onClick={() => setDate(summary.date)}
                className="w-full rounded-lg border border-slate-200 bg-white/60 p-3 text-left transition hover:border-emerald-300 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-sm font-bold text-slate-950 dark:text-white">{format(parseISO(summary.date), "MMM d, yyyy")}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{summary.content}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
