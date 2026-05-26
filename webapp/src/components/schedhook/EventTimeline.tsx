import type { DataItem } from "vis-timeline";
import type { SchedTask } from "@/types/ui/schedhook";
import type { GroupItem } from "@/components/schedhook/VisTimeline";
import VisTimeline from "@/components/schedhook/VisTimeline";
import { cn } from "@/shadcn/lib/utils";

type EventTimelineProps = {
  events: SchedTask[];
};

function toGroupItems(events: SchedTask[]): GroupItem[] {
  const cpuSet = new Set<number>(events.map((ev) => ev.cpu));
  return Array.from(cpuSet)
    .sort()
    .map((cpu) => ({
      id: cpu,
      content: `CPU ${cpu}`,
    }));
}

function normTimestamp(ts: bigint): number {
  return Number(BigInt(ts));
}

function toClassName(ev: SchedTask): string {
  if (ev.key.pid === 0) {
    return "!bg-neutral-500 !opacity-50 hover:!opacity-100 !border !border-gray-900";
  }
  if (ev.kthread) {
    return "!bg-red-400 !opacity-50 hover:!opacity-100 !border !border-red-900";
  }
  return "!bg-blue-400 !opacity-50 hover:!opacity-100 !border !border-blue-900";
}

function toDataItems(events: SchedTask[]): DataItem[] {
  return events.map((ev, index) => ({
    id: index,
    group: ev.cpu,
    content: `${ev.name} (PID: ${ev.key.pid})`,
    start: normTimestamp(ev.startNorm),
    end: normTimestamp(ev.endNorm),
    title: `Interval: [${ev.start}, ${ev.end}) Duration: ${ev.duration} ns`,
    className: toClassName(ev),
  }));
}

export default function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div
      className={cn(
        "w-full h-[300px]",
        "flex items-center justify-center",
        "border border-border rounded",
      )}
    >
      {events.length === 0 ? (
        <p className="text-mono text-md">
          Press <b>Start Capture</b>, wait few seconds and press{" "}
          <b>End capture</b> to display the captured events
        </p>
      ) : (
        <VisTimeline
          items={toDataItems(events)}
          groups={toGroupItems(events)}
        />
      )}
    </div>
  );
}
