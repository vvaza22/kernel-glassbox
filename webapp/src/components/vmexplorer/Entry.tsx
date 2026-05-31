import {
  VME_MASK_ACCESSED,
  VME_MASK_DIRTY,
  VME_MASK_GLOBAL,
  VME_MASK_NX,
  VME_MASK_PCD,
  VME_MASK_PRESENT,
  VME_MASK_PSE,
  VME_MASK_PWT,
  VME_MASK_RW,
  VME_MASK_USER,
  type VMEntry,
} from "@/types/ui/vmexplorer";
import { cn } from "@/shadcn/lib/utils";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/shadcn/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shadcn/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shadcn/components/ui/hover-card";
import { isFlagSet } from "@/helpers/vmexplorer";
import OptionalLink from "../shared/OptionalLink";

function toBadgeStyle(flagMask: bigint): string {
  /* 
    Note: bg-950, text-300 combo is taken from shadcn's documentation which I really liked:
    https://ui.shadcn.com/docs/components/base/badge 
    */
  switch (flagMask) {
    case VME_MASK_PRESENT:
      return "bg-sky-950 text-sky-300";
    case VME_MASK_ACCESSED:
      return "bg-yellow-950 text-yellow-300";
    case VME_MASK_DIRTY:
      return "bg-purple-950 text-purple-300";
    case VME_MASK_USER:
      return "bg-blue-950 text-blue-300";
    case VME_MASK_RW:
      return "bg-green-950 text-green-300";
    case VME_MASK_NX:
      return "bg-red-950 text-red-300";
    default:
      return "bg-gray-950 text-gray-300";
  }
}

type FlagRowProps = {
  rawValue: bigint;
  flagMask: bigint;
  label: string;
  desc: string;
};

function FlagRow({ rawValue, flagMask, label, desc }: FlagRowProps) {
  if (!isFlagSet(rawValue, flagMask)) {
    return null;
  }
  return (
    <div className="flex flex-row items-center justify-between">
      <Badge
        className={cn("text-sm font-mono font-bold", toBadgeStyle(flagMask))}
      >
        {label}
      </Badge>
      <span className="font-mono text-sm text-muted-foreground">{desc}</span>
    </div>
  );
}

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
  link?: string;
};

export default function Entry({ entry, link }: EntryProps) {
  const { t } = useTranslation("vmexplorer");

  return (
    <HoverCard>
      <HoverCardTrigger delay={0} closeDelay={0}>
        <OptionalLink href={link}>
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
                <div className="flex gap-1 text-sm items-center text-sky-300">
                  <span>{t("pageTableUpper")}</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
            <div>
              <EntryRow label={t("entryRaw")} value={entry.rawValueHex} />
              <EntryRow label={t("entryPA")} value={entry.pa} />
              <EntryRow label={t("entryKernelVA")} value={entry.kernelVA} />
              <EntryRow label={t("entryUserVA")} value={entry.userVAStart} />
            </div>
          </div>
        </OptionalLink>
      </HoverCardTrigger>
      <HoverCardContent side="right" className="ring-border ring-1">
        <div className={cn("flex flex-col gap-1")}>
          <h2 className="font-bold font-mono text-muted-foreground text-base">
            {t("regionLabel")}
          </h2>
          <div className="flex flex-row justify-between items-center">
            <span className="font-mono text-sm text-muted-foreground">
              {t("startLabel")}
            </span>
            <span>{entry.userVAStart}</span>
          </div>
          <div className="flex flex-row justify-between items-center">
            <span className="font-mono text-sm text-muted-foreground">
              {t("endLabel")}
            </span>
            <span>{entry.userVAEnd}</span>
          </div>
          <div className="flex flex-row justify-between items-center">
            <span className="font-mono text-sm text-muted-foreground">
              {t("sizeLabel")}
            </span>
            <span>{entry.sizeFormatted}</span>
          </div>
          <Separator className="mt-2 mb-2" />
          <h2 className="font-bold font-mono text-muted-foreground text-base">
            {t("flagsLabel")}
          </h2>
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_PRESENT}
            label={t("flags.present.label")}
            desc={t("flags.present.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_RW}
            label={t("flags.rw.label")}
            desc={t("flags.rw.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_USER}
            label={t("flags.user.label")}
            desc={t("flags.user.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_PWT}
            label={t("flags.pwt.label")}
            desc={t("flags.pwt.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_PCD}
            label={t("flags.pcd.label")}
            desc={t("flags.pcd.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_ACCESSED}
            label={t("flags.accessed.label")}
            desc={t("flags.accessed.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_DIRTY}
            label={t("flags.dirty.label")}
            desc={t("flags.dirty.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_PSE}
            label={t("flags.pse.label")}
            desc={t("flags.pse.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_GLOBAL}
            label={t("flags.global.label")}
            desc={t("flags.global.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            flagMask={VME_MASK_NX}
            label={t("flags.nx.label")}
            desc={t("flags.nx.desc")}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
