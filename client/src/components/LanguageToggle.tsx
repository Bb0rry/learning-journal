import { Languages } from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { Button } from "./ui/button";

export function LanguageToggle() {
  const { toggleLanguage, t } = useLanguage();
  return (
    <Button variant="secondary" size="sm" onClick={toggleLanguage} aria-label={t("languageLabel")}>
      <Languages size={16} />
      {t("languageButton")}
    </Button>
  );
}
