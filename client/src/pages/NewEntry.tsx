import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { EntryForm } from "../components/EntryForm";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import type { EntryInput } from "../types";

export function NewEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tags = useQuery({ queryKey: ["tags"], queryFn: api.tags });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const mutation = useMutation({
    mutationFn: (input: EntryInput) => api.createEntry(input),
    onSuccess: (entry) => {
      toast.success(t("entryCreated"));
      queryClient.invalidateQueries();
      navigate(`/entry/${entry.id}`);
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t("entries")} / {t("new")}</p>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("newEntry")}</h1>
      </div>
      <EntryForm
        categories={categories.data?.map((item) => item.category) ?? ["Other"]}
        knownTags={tags.data?.map((item) => item.tag) ?? []}
        onSubmit={(input) => mutation.mutate(input)}
        submitting={mutation.isPending}
      />
    </div>
  );
}
