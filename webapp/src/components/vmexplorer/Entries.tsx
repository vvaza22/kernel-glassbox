import { cn } from "@/shadcn/lib/utils";
import type { VMEntry } from "@/types/ui/vmexplorer";
import Entry from "./Entry";

type EntriesProps = {
  entries: VMEntry[];
  pathIndices: number[];
  toLink: (indices?: number[]) => string;
};

export default function Entries({
  entries,
  pathIndices,
  toLink,
}: EntriesProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        "2xl:grid-cols-6 xl:grid-cols-4 md:grid-cols-2",
      )}
    >
      {entries.map((entry) => (
        <Entry
          entry={entry}
          link={
            !entry.leaf && entry.present
              ? toLink([...pathIndices, entry.index])
              : undefined
          }
        />
      ))}
    </div>
  );
}
