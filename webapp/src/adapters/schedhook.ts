import type { WebsocketSchedEvent } from "@/types/ws/schedhook";
import type { SchedEvent } from "@/types/ui/schedhook";
import { bigIntComparator } from "@/helpers/math";

function toSchedTask(
  cur: WebsocketSchedEvent,
  next: WebsocketSchedEvent,
): SchedEvent {
  const curTimestamp = BigInt(cur.timestamp);
  const nextTimestamp = BigInt(next.timestamp);
  return {
    key: cur.next,
    name: cur.commNext,
    cpu: cur.cpu,
    start: curTimestamp,
    end: nextTimestamp,
    startNorm: curTimestamp,
    endNorm: nextTimestamp,
    duration: nextTimestamp - curTimestamp,
    kthread: cur.nextIsKthread,
  };
}

function toSchedTaskPerCPU(events: WebsocketSchedEvent[]): SchedEvent[] {
  const result: SchedEvent[] = [];

  if (events.length === 0) {
    return result;
  }

  // Sort events by timestamp in ascending order
  events.sort((a, b) =>
    bigIntComparator(BigInt(a.timestamp), BigInt(b.timestamp)),
  );

  for (let i = 0; i < events.length - 1; i++) {
    result.push(toSchedTask(events[i], events[i + 1]));
  }

  return result;
}

export function toSchedEvents(events: WebsocketSchedEvent[]): SchedEvent[] {
  const result: SchedEvent[] = [];
  const byCPU = new Map<number, WebsocketSchedEvent[]>();

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
