import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EntryCard } from "../components/EntryCard";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/ui/button";
import { Select, Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";

function highlight(text: string, needle: string) {
  if (!needle) return text;
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? <mark key={index} className="rounded bg-amber-300/60 px-1 text-slate-950">{part}</mark> : part
  );
}

export function SearchPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [tag, setTag] = useState(params.get("tag") ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const tags = useQuery({ queryKey: ["tags"], queryFn: api.tags });
  const entries = useQuery({
    queryKey: ["search", debounced, category, tag, from, to],
    queryFn: () => api.entries({ search: debounced, category, tag, from, to, limit: 30 })
  });

  const active = useMemo(() => Boolean(debounced || category || tag || from || to), [debounced, category, tag, from, to]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("navSearch")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("searchSubtitle")}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="glass h-fit rounded-xl p-5">
          <div className="space-y-4">
            <SearchBar autoFocus value={term} onChange={(event) => setTerm(event.target.value)} />
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{t("allCategories")}</option>
              {categories.data?.map((item) => <option key={item.category}>{item.category}</option>)}
            </Select>
            <Select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="">{t("allTags")}</option>
              {tags.data?.map((item) => <option key={item.tag}>{item.tag}</option>)}
            </Select>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            <Button variant="secondary" className="w-full" onClick={() => { setTerm(""); setCategory(""); setTag(""); setFrom(""); setTo(""); }}>{t("clear")}</Button>
          </div>
        </aside>
        <section className="space-y-4">
          {entries.isLoading && <Skeleton className="h-72" />}
          {entries.isError && <p className="glass rounded-xl p-6 text-rose-500">{t("searchFailed")}</p>}
          {entries.data?.items.length === 0 && (
            <div className="glass rounded-xl p-10 text-center">
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-300 to-violet-300 opacity-80" />
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">{active ? t("noMatchingEntries") : t("startSearching")}</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">{t("searchEmptyHelp")}</p>
            </div>
          )}
          {entries.data?.items.map((entry) => (
            <EntryCard key={entry.id} entry={entry} titleOverride={highlight(entry.title, debounced)} />
          ))}
        </section>
      </div>
    </div>
  );
}
