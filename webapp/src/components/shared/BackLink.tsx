import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/shadcn/lib/utils";

export default function BackLink() {
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
