import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CalendarDays, FilePenLine, Folder, Home, ListChecks, Plus, Search, Tags } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

const nav = [
  { to: "/", labelKey: "navDashboard", icon: Home },
  { to: "/plan", labelKey: "navPlan", icon: ListChecks },
  { to: "/daily-summary", labelKey: "navDailySummary", icon: FilePenLine },
  { to: "/timeline", labelKey: "navTimeline", icon: CalendarDays },
  { to: "/search", labelKey: "navSearch", icon: Search },
  { to: "/categories", labelKey: "navCategories", icon: Folder },
  { to: "/tags", labelKey: "navTags", icon: Tags }
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const searchFocusRef = useRef(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        navigate("/entry/new");
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchFocusRef.current = true;
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_28%)] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:block">
        <Link to="/" className="flex items-center gap-3">
          <span className="rounded-xl bg-emerald-400 p-2 text-slate-950">
            <BookOpen size={22} />
          </span>
          <span className="text-lg font-extrabold">{t("appName")}</span>
        </Link>
        <nav className="mt-10 space-y-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-emerald-400 text-slate-950" : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10"
                }`
              }
            >
              <item.icon size={18} />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2 font-extrabold lg:hidden">
              <BookOpen className="text-emerald-400" />
              {t("appShortName")}
            </Link>
            <div className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{t("shortcutHint")}</div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button onClick={() => navigate("/entry/new")}>
                <Plus size={18} /> {t("new")}
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-7 rounded-2xl border border-white/40 bg-white/85 p-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 lg:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${isActive ? "bg-emerald-400 text-slate-950" : "text-slate-500 dark:text-slate-300"}`
              }
            >
              <item.icon size={17} />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <Link to="/entry/new" className="fixed bottom-24 right-5 z-30 rounded-full bg-gradient-to-r from-emerald-400 to-violet-400 p-4 text-slate-950 shadow-glow transition hover:scale-105 lg:bottom-6">
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
