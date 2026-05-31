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

export function Categories() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#34d399");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#94a3b8");
  const query = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const create = useMutation({
    mutationFn: ({ categoryName, categoryColor }: { categoryName: string; categoryColor: string }) => api.createCategory(categoryName, categoryColor),
    onSuccess: () => {
      toast.success(t("categoryCreated"));
      setName("");
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });
  const update = useMutation({
    mutationFn: ({ oldName, nextName, nextColor }: { oldName: string; nextName: string; nextColor: string }) => api.updateCategory(oldName, nextName, nextColor),
    onSuccess: () => {
      toast.success(t("categoryUpdated"));
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });
  const remove = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      toast.success(t("categoryDeleted"));
      refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("navCategories")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("categoriesSubtitle")}</p>
      </div>

      <form
        className="glass flex flex-col gap-3 rounded-xl p-4 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate({ categoryName: name.trim(), categoryColor: color });
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("namePlaceholder")} />
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300">
          {t("color")}
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
        </label>
        <Button type="submit" disabled={create.isPending}>
          <Plus size={18} /> {t("addCategory")}
        </Button>
      </form>

      {query.isLoading && <Skeleton className="h-72" />}
      {query.data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((item) => (
            <div key={item.category} className="glass rounded-xl p-5">
              <span className="block h-2 w-16 rounded-full" style={{ backgroundColor: item.color }} />
              {editing === item.category ? (
                <div className="mt-5 space-y-3">
                  <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
                  <label className="flex h-11 items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300">
                    {t("color")}
                    <input type="color" value={editColor} onChange={(event) => setEditColor(event.target.value)} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editName.trim() && update.mutate({ oldName: item.category, nextName: editName.trim(), nextColor: editColor })}>{t("rename")}</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>{t("clear")}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <Link to={`/search?category=${item.category}`}>
                    <h2 className="mt-5 text-2xl font-extrabold text-slate-950 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-300">{item.category}</h2>
                  </Link>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">{t("entryCount", { count: item.count })}</p>
                  <div className="mt-5 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(item.category); setEditName(item.category); setEditColor(item.color); }}>
                      <Pencil size={15} /> {t("rename")}
                    </Button>
                    <Button size="sm" variant="danger" disabled={item.category === "Other"} onClick={() => window.confirm(t("deleteCategoryConfirm")) && remove.mutate(item.category)}>
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
  );
}
