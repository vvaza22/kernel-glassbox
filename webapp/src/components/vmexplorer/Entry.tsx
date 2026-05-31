import type { VMEntry } from "@/types/ui/vmexplorer";
import { cn } from "@/shadcn/lib/utils";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type EntryRowProps = {
  label: string;
  value: string;
};

function EntryRow({ label, value }: EntryRowProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="font-mono text-muted-foreground text-sm">{label}</div>
      <div className="font-mono text-foreground text-base">{value}</div>
    </div>
  );
}

type EntryProps = {
  entry: VMEntry;
};

export default function Entry({ entry }: EntryProps) {
  const { t } = useTranslation("vmexplorer");

  return (
    <div
      className={cn(
        "p-3",
        "border rounded-md",
        "transition-colors",
        entry.leaf
          ? "border-emerald-800"
          : "border-border hover:border-zinc-700",
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono font-bold text-sm">[{entry.index}]</div>
        {entry.leaf ? (
          <div className="font-mono text-sm text-emerald-400">
            {t("pageUpper")}
          </div>
        ) : (
          <div className="flex gap-1 text-sm items-center">
            <span>{t("pageTableUpper")}</span>
            <ArrowRight size={16} />
          </div>
        )}
      </div>
      <div>
        <EntryRow label={t("entryRaw")} value={entry.rawValueHex} />
        <EntryRow label={t("entryPA")} value={entry.pa} />
        <EntryRow label={t("entryKernelVA")} value={entry.kernelVA} />
        <EntryRow label={t("entryUserVA")} value={entry.userVA} />
      </div>
    </div>
  );
}
