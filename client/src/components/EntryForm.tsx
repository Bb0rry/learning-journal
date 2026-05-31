import MDEditor from "@uiw/react-md-editor";
import { Plus, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/input";
import { useLanguage } from "../lib/i18n";
import type { Entry, EntryInput } from "../types";

export function EntryForm({
  initial,
  categories = [],
  knownTags = [],
  onSubmit,
  submitting
}: {
  initial?: Entry;
  categories?: string[];
  knownTags?: string[];
  submitting?: boolean;
  onSubmit: (input: EntryInput) => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Other");
  const [customCategory, setCustomCategory] = useState("");
  const [tagText, setTagText] = useState(initial?.tags.join(", ") ?? "");
  const [hours, setHours] = useState(String(Math.floor((initial?.duration_minutes ?? 45) / 60)));
  const [minutes, setMinutes] = useState(String((initial?.duration_minutes ?? 45) % 60));
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? "");
  const [draft, setDraft] = useState(false);
  const [error, setError] = useState("");

  const suggestions = useMemo(() => knownTags.slice(0, 12), [knownTags]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!title.trim()) return setError(t("titleRequired"));
    if (!content.trim() && !draft) return setError(t("notesRequired"));
    const duration = Number(hours || 0) * 60 + Number(minutes || 0);
    const selectedCategory = category === "__custom" ? customCategory.trim() : category;
    if (!selectedCategory) return setError(t("titleRequired"));
    onSubmit({
      title: draft ? `[Draft] ${title.trim().replace(/^\[Draft\]\s*/, "")}` : title.trim().replace(/^\[Draft\]\s*/, ""),
      content: content.trim() || t("draftEntry"),
      category: selectedCategory,
      tags: tagText.split(",").map((tag) => tag.trim()).filter(Boolean),
      duration_minutes: Number.isFinite(duration) ? duration : 0,
      source_url: sourceUrl.trim()
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="glass rounded-xl p-5" data-color-mode="auto">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("title")}</label>
        <Input className="mt-2 text-lg font-semibold" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("titlePlaceholder")} />
        <div className="mt-5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("notes")}</label>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
            <MDEditor value={content} onChange={(value) => setContent(value ?? "")} height={420} preview="edit" />
          </div>
        </div>
      </section>
      <aside className="glass h-fit rounded-xl p-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("category")}</label>
            <Select className="mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
              <option value="__custom">+ {t("addCategory")}</option>
            </Select>
            {category === "__custom" && (
              <Input className="mt-2" value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} placeholder={t("namePlaceholder")} />
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("tags")}</label>
            <Input className="mt-2" value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="react, typescript" list="tag-suggestions" />
            <datalist id="tag-suggestions">{suggestions.map((tag) => <option key={tag} value={tag} />)}</datalist>
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Plus size={13} /> {t("addTag")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("hours")}</label>
              <Input className="mt-2" type="number" min="0" value={hours} onChange={(event) => setHours(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("minutes")}</label>
              <Input className="mt-2" type="number" min="0" max="59" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("sourceUrl")}</label>
            <Input className="mt-2" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." />
          </div>
          <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-semibold dark:border-white/10">
            {t("saveAsDraft")}
            <input type="checkbox" checked={draft} onChange={(event) => setDraft(event.target.checked)} className="h-5 w-5 accent-emerald-400" />
          </label>
          {error && <p className="rounded-lg bg-rose-500/10 p-3 text-sm font-semibold text-rose-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}><Save size={18} /> {t("saveEntry")}</Button>
        </div>
      </aside>
    </form>
  );
}
