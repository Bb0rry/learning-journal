import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Clock, ExternalLink, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { minutesToLabel } from "../lib/utils";

export function EntryDetail() {
  const { t } = useLanguage();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const entry = useQuery({ queryKey: ["entry", id], queryFn: () => api.entry(id), enabled: Boolean(id) });
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteEntry(id),
    onSuccess: () => {
      toast.success(t("entryDeleted"));
      queryClient.invalidateQueries();
      navigate("/timeline");
    },
    onError: (error) => toast.error(error.message)
  });

  if (entry.isLoading) return <Skeleton className="h-96" />;
  if (entry.isError || !entry.data) return <p className="glass rounded-xl p-6 text-rose-500">{t("entryNotFound")}</p>;

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/timeline" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-500 dark:text-slate-400">
          <ArrowLeft size={16} /> Timeline
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/entry/${id}/edit`)}><Pencil size={16} /> {t("edit")}</Button>
          <Button variant="danger" onClick={() => window.confirm(t("deleteConfirm")) && deleteMutation.mutate()}><Trash2 size={16} /> {t("delete")}</Button>
        </div>
      </div>
      <header className="glass rounded-xl p-6">
        <p className="text-sm font-semibold text-emerald-500">{t("entries")} / {entry.data.category}</p>
        <h1 className="mt-2 text-4xl font-extrabold text-slate-950 dark:text-white">{entry.data.title}</h1>
        {entry.data.summary && (
          <p className="mt-3 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
            {entry.data.summary}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>{format(new Date(entry.data.created_at), "MMMM d, yyyy 'at' h:mm a")}</span>
          <span className="inline-flex items-center gap-1"><Clock size={15} /> {minutesToLabel(entry.data.duration_minutes)}</span>
          {entry.data.source_url && <a className="inline-flex items-center gap-1 text-violet-500" href={entry.data.source_url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> {t("source")}</a>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.data.tags.map((tag) => <Link key={tag} to={`/search?tag=${tag}`} className="rounded-full bg-violet-400/10 px-3 py-1 text-sm font-semibold text-violet-600 dark:text-violet-200">#{tag}</Link>)}
        </div>
      </header>
      <section className="glass prose prose-slate max-w-none rounded-xl p-6 dark:prose-invert">
        <ReactMarkdown>{entry.data.content}</ReactMarkdown>
      </section>
    </article>
  );
}
