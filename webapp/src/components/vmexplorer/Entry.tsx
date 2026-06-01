import {
  VME_BIT_ACCESSED,
  VME_BIT_DIRTY,
  VME_BIT_GLOBAL,
  VME_BIT_NX,
  VME_BIT_PCD,
  VME_BIT_PRESENT,
  VME_BIT_PSE,
  VME_BIT_PWT,
  VME_BIT_RW,
  VME_BIT_USER,
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

function toBadgeStyle(bit: bigint): string {
  /* 
    Note: bg-950, text-300 combo idea is inspired by shadcn's documentation:
    https://ui.shadcn.com/docs/components/base/badge 
    */
  switch (bit) {
    case VME_BIT_PRESENT:
      return "bg-sky-950 text-sky-300";
    case VME_BIT_ACCESSED:
      return "bg-yellow-950 text-yellow-300";
    case VME_BIT_DIRTY:
      return "bg-purple-950 text-purple-300";
    case VME_BIT_USER:
      return "bg-blue-950 text-blue-300";
    case VME_BIT_RW:
      return "bg-green-950 text-green-300";
    case VME_BIT_NX:
      return "bg-red-950 text-red-300";
    default:
      return "bg-gray-950 text-gray-300";
  }
}

type FlagRowProps = {
  rawValue: bigint;
  bit: bigint;
  label: string;
  desc: string;
};

function FlagRow({ rawValue, bit, label, desc }: FlagRowProps) {
  if (!isFlagSet(rawValue, bit)) {
    return null;
  }
  return (
    <div className="flex flex-row items-center justify-between">
      <Badge className={cn("text-sm font-mono font-bold", toBadgeStyle(bit))}>
        <span>{bit}</span>
        <span>|</span>
        <span>{label}</span>
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

function entryBorderStyle(entry: VMEntry): string {
  if (!entry.present) {
    return "border-yellow-800 border-dashed";
  }
  if (entry.leaf) {
    return "border-emerald-800";
  }
  return "border-border hover:border-zinc-700";
}

function EntryLabel({ entry }: { entry: VMEntry }) {
  const { t } = useTranslation("vmexplorer");

  if (!entry.present) {
    return (
      <div className="font-mono text-sm text-yellow-400">{t("notPresent")}</div>
    );
  }

  if (entry.leaf) {
    return (
      <div className="font-mono text-sm text-emerald-400">
        {entry.sizeFormatted} {t("pageUpper")}
      </div>
    );
  }

  return (
    <div className="flex gap-1 text-sm items-center text-sky-300">
      <span>{t("pageTableUpper")}</span>
      <ArrowRight size={16} />
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
              entryBorderStyle(entry),
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono font-bold text-sm">[{entry.index}]</div>
              <EntryLabel entry={entry} />
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
      <HoverCardContent
        side="right"
        className="ring-border ring-1 xl:min-w-[400px]"
      >
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
            bit={VME_BIT_PRESENT}
            label={t("flags.present.label")}
            desc={t("flags.present.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_RW}
            label={t("flags.rw.label")}
            desc={t("flags.rw.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_USER}
            label={t("flags.user.label")}
            desc={t("flags.user.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_PWT}
            label={t("flags.pwt.label")}
            desc={t("flags.pwt.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_PCD}
            label={t("flags.pcd.label")}
            desc={t("flags.pcd.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_ACCESSED}
            label={t("flags.accessed.label")}
            desc={t("flags.accessed.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_DIRTY}
            label={t("flags.dirty.label")}
            desc={t("flags.dirty.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_PSE}
            label={t("flags.pse.label")}
            desc={t("flags.pse.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_GLOBAL}
            label={t("flags.global.label")}
            desc={t("flags.global.desc")}
          />
          <FlagRow
            rawValue={entry.rawValue}
            bit={VME_BIT_NX}
            label={t("flags.nx.label")}
            desc={t("flags.nx.desc")}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
