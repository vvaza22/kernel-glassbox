import { useTranslation } from "react-i18next";

export function NoEntries() {
  const { t } = useTranslation("vmexplorer");
  return (
    <div className="flex items-center justify-center h-32">
      <p className="text-muted-foreground text-mono text-xl">
        {t("noEntries")}
      </p>
    </div>
  );
}
