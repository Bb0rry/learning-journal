import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";

export function TagsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const query = useQuery({ queryKey: ["tags"], queryFn: api.tags });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tags"] });
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const create = useMutation({
    mutationFn: api.createTag,
    onSuccess: () => {
      toast.success(t("tagCreated"));
      setName("");
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });
  const update = useMutation({
    mutationFn: ({ oldName, nextName }: { oldName: string; nextName: string }) => api.updateTag(oldName, nextName),
    onSuccess: () => {
      toast.success(t("tagUpdated"));
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });
  const remove = useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => {
      toast.success(t("tagDeleted"));
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("navTags")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("tagsSubtitle")}</p>
      </div>

      <form
        className="glass flex flex-col gap-3 rounded-xl p-4 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate(name.trim());
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("namePlaceholder")} />
        <Button type="submit" disabled={create.isPending}>
          <Plus size={18} /> {t("addTag")}
        </Button>
      </form>

      <div className="glass rounded-xl p-6">
        {query.isLoading && <Skeleton className="h-36" />}
        {query.data && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {query.data.map((item) => (
              <div key={item.tag} className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                {editing === item.tag ? (
                  <div className="space-y-3">
                    <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => editName.trim() && update.mutate({ oldName: item.tag, nextName: editName.trim() })}>{t("rename")}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>{t("clear")}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link to={`/search?tag=${encodeURIComponent(item.tag)}`} className="text-lg font-extrabold text-violet-700 hover:text-violet-500 dark:text-violet-200">
                      #{item.tag}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("entryCount", { count: item.count })}</p>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => { setEditing(item.tag); setEditName(item.tag); }}>
                        <Pencil size={15} /> {t("rename")}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => window.confirm(t("deleteTagConfirm")) && remove.mutate(item.tag)}>
                        <Trash2 size={15} /> {t("delete")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
