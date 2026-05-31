import { Search } from "lucide-react";
import { forwardRef } from "react";
import { useLanguage } from "../lib/i18n";
import { Input } from "./ui/input";

export const SearchBar = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    const { t } = useLanguage();
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input ref={ref} className="pl-10" placeholder={t("searchPlaceholder")} {...props} />
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";
