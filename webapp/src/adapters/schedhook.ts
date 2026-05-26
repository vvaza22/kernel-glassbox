import type { SchedEvent } from "@/types/ws/schedhook";
import type { SchedTask } from "@/types/ui/schedhook";
import { bigIntComparator } from "@/helpers/math";

function toSchedTask(cur: SchedEvent, next: SchedEvent): SchedTask {
  return {
    key: cur.next,
    name: cur.commNext,
    cpu: cur.cpu,
    start: cur.timestamp,
    end: next.timestamp,
    startNorm: cur.timestamp,
    endNorm: next.timestamp,
    startLog: cur.timestamp,
    endLog: next.timestamp,
    duration: next.timestamp - cur.timestamp,
    kthread: cur.nextIsKthread,
  };
}

function toSchedTaskPerCPU(events: SchedEvent[]): SchedTask[] {
  const result: SchedTask[] = [];

  if (events.length === 0) {
    return result;
  }

  // Sort events by timestamp in ascending order
  events.sort((a, b) => bigIntComparator(a.timestamp, b.timestamp));

  for (let i = 0; i < events.length - 1; i++) {
    result.push(toSchedTask(events[i], events[i + 1]));
  }

  return result;
}

export function toSchedTasks(events: SchedEvent[]): SchedTask[] {
  const result: SchedTask[] = [];
  const byCPU = new Map<number, SchedEvent[]>();

  if (events.length === 0) {
    return result;
  }

  for (const event of events) {
    if (!byCPU.has(event.cpu)) {
      byCPU.set(event.cpu, []);
    }
    byCPU.get(event.cpu)!.push(event);
  }

  for (const cpuEvents of byCPU.values()) {
    result.push(...toSchedTaskPerCPU(cpuEvents));
  }

  // Sort in ascending order by start time
  result.sort((a, b) => bigIntComparator(a.start, b.start));

  // Make the earliest timestamp 0
  const smallestStart = result[0].start;
  return result.map((ev) => ({
    ...ev,
    startNorm: ev.start - smallestStart,
    endNorm: ev.end - smallestStart,
  }));
}
