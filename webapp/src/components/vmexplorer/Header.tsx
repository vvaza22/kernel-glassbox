import { useTranslation } from "react-i18next";
import { cn } from "@/shadcn/lib/utils";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/shadcn/components/ui/badge";

type HeaderProps = {
  pid: string;
  startTime: string;
};

function BackLink() {
  const { t } = useTranslation("vmexplorer");

  return (
    <div className="flex">
      <Link
        href="/"
        className={cn(
          "text-mono text-sm rounded-md",
          "text-slate-500 hover:text-slate-300 hover:bg-zinc-800",
          "flex items-center gap-1 whitespace-nowrap",
          "transition-colors",
        )}
      >
        <ArrowLeft size={18} />
        <span>{t("backToProctree")}</span>
      </Link>
    </div>
  );
}

type LabelBadgeProps = {
  label: string;
  value: string;
};

function LabelBadge({ label, value }: LabelBadgeProps) {
  return (
    <Badge className="font-mono text-sm" variant="outline">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </Badge>
  );
}

export default function Header({ pid, startTime }: HeaderProps) {
  const { t } = useTranslation("vmexplorer");

  return (
    <div className="mb-5">
      <div className="mb-2">
        <BackLink />
      </div>
      <div className="flex">
        <div className={cn("flex flex-col", "gap-1")}>
          <h1 className={cn("text-2xl font-mono")}>{t("title")}</h1>
          <div className="flex flex-row justify-start gap-1">
            <LabelBadge label={t("pidBadge")} value={pid} />
            <LabelBadge label={t("startTimeBadge")} value={startTime} />
          </div>
        </div>
      </div>
    </div>
  );
}
