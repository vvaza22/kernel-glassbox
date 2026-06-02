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
  if (ev.key.pid === "0") {
    return "!bg-yellow-950 hover:!bg-yellow-900 !text-yellow-300 !border !border-yellow-800";
  }
  if (ev.kthread) {
    return "!bg-red-950 hover:!bg-red-900 !text-red-300 !border !border-red-800";
  }
  return "!bg-blue-950 hover:!bg-blue-900 !text-blue-300 !border !border-blue-800";
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
        "w-full",
        "flex items-center justify-center",
        events.length === 0 ? "border border-border rounded h-64" : "",
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
