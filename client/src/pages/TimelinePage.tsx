import { useState } from "react";
import { Timeline } from "../components/Timeline";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useEntries } from "../hooks/useEntries";
import { useLanguage } from "../lib/i18n";

export function TimelinePage() {
  const { t } = useLanguage();
  const [limit, setLimit] = useState(8);
  const query = useEntries({ page: 1, limit });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">{t("navTimeline")}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{t("timelineSubtitle")}</p>
      </div>
      {query.isLoading && <Skeleton className="h-96" />}
      {query.isError && <p className="glass rounded-xl p-6 text-rose-500">{t("failedTimeline")}</p>}
      {query.data && (
        <>
          {query.data.items.length ? <Timeline entries={query.data.items} /> : <p className="glass rounded-xl p-6 text-slate-500">{t("noEntries")}</p>}
          {query.data.hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((value) => value + 8)}>{t("loadMore")}</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
