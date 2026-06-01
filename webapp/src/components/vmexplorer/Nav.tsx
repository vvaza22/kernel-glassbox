import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/components/ui/breadcrumb";
import { cn } from "@/shadcn/lib/utils";
import { Link } from "wouter";
import { VME_UNSPEC_INDEX } from "@/types/ws/vmexplorer";
import { Badge } from "@/shadcn/components/ui/badge";
import { useTranslation } from "react-i18next";

type NavEntryProps = {
  label: string;
  active: boolean;
  index: number;
  link: string;
};

function NavEntry({ active, link, label, index }: NavEntryProps) {
  const content = (
    <div
      className={cn(
        "font-mono text-lg",
        "rounded-md py-.5 px-2",
        "transition-colors",
        active
          ? "text-sky-500"
          : "hover:bg-zinc-800 hover:text-emerald-400 cursor-pointer",
      )}
    >
      <span>{label}</span>
      {index !== VME_UNSPEC_INDEX && <span>[{index}]</span>}
    </div>
  );
  if (active) return content;
  return <Link href={link}>{content}</Link>;
}

type LinkBuilderFunc = (indices?: number[]) => string;

type NavProps = {
  pathIndices: number[];
  numEntries: number;
  toLink: LinkBuilderFunc;
};

export default function Nav({ pathIndices, numEntries, toLink }: NavProps) {
  const { t } = useTranslation("vmexplorer");
  const lvls = [t("lvlRoot"), t("lvl4"), t("lvl3"), t("lvl2"), t("lvl1")];

  const rootEntry = (
    <NavEntry
      label={lvls[0]}
      index={VME_UNSPEC_INDEX}
      active={pathIndices.length === 0}
      link={toLink()}
    />
  );

  const entries = pathIndices.map((index, level) => (
    <NavEntry
      key={`l${level}`}
      label={lvls[level + 1]}
      index={index}
      active={level === pathIndices.length - 1}
      link={toLink(pathIndices.slice(0, level + 1))}
    />
  ));

  return (
    <div className={cn("mb-4", "flex justify-between items-center")}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={rootEntry} />
          </BreadcrumbItem>
          {entries.map((entry) => (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem key={entry.key}>
                <BreadcrumbLink render={entry} />
              </BreadcrumbItem>
            </>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Badge className="text-base" variant="secondary">
        <span>{numEntries}</span>
        <span>{t("entries")}</span>
      </Badge>
    </div>
  );
}
