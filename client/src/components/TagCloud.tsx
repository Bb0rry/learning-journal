import { Link } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

export function TagCloud({ tags }: { tags: { tag: string; count: number }[] }) {
  const { t } = useLanguage();
  const max = Math.max(1, ...tags.map((item) => item.count));
  if (!tags.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t("noTags")}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((item) => (
        <Link
          key={item.tag}
          to={`/search?tag=${encodeURIComponent(item.tag)}`}
          style={{ fontSize: `${0.78 + (item.count / max) * 0.45}rem` }}
          className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 font-semibold text-violet-700 transition hover:bg-violet-400/20 dark:text-violet-200"
        >
          #{item.tag}
        </Link>
      ))}
    </div>
  );
}
