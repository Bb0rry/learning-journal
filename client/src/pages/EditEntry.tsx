import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EntryForm } from "../components/EntryForm";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import type { EntryInput } from "../types";

export function EditEntry() {
  const { t } = useLanguage();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const entry = useQuery({ queryKey: ["entry", id], queryFn: () => api.entry(id), enabled: Boolean(id) });
  const tags = useQuery({ queryKey: ["tags"], queryFn: api.tags });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const mutation = useMutation({
    mutationFn: (input: EntryInput) => api.updateEntry(id, input),
    onSuccess: (updated) => {
      toast.success(t("entryUpdated"));
      queryClient.invalidateQueries();
      navigate(`/entry/${updated.id}`);
    },
    onError: (error) => toast.error(error.message)
  });

  if (entry.isLoading) return <Skeleton className="h-96" />;
  if (entry.isError || !entry.data) return <p className="glass rounded-xl p-6 text-rose-500">{t("entryNotFound")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400"><Link to={`/entry/${id}`}>{t("entry")}</Link> / {t("edit")}</p>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("editEntry")}</h1>
      </div>
      <EntryForm
        initial={entry.data}
        categories={categories.data?.map((item) => item.category) ?? [entry.data.category, "Other"]}
        knownTags={tags.data?.map((item) => item.tag) ?? []}
        onSubmit={(input) => mutation.mutate(input)}
        submitting={mutation.isPending}
      />
    </div>
  );
}
