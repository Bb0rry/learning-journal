import { Compass, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useLanguage } from "../lib/i18n";

export function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="glass max-w-lg rounded-xl p-10 text-center">
        <Compass className="mx-auto text-emerald-400" size={54} />
        <h1 className="mt-5 text-5xl font-extrabold gradient-text">404</h1>
        <p className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-200">{t("notFoundTitle")}</p>
        <Link to="/" className="mt-6 inline-flex">
          <Button><Home size={18} /> {t("dashboard")}</Button>
        </Link>
      </div>
    </div>
  );
}
