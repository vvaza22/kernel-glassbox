import type { WebsocketTaskKey } from "./shared";
import { isWebsocketTaskKey } from "./shared";

export type SchedEvent = {
  prev: WebsocketTaskKey;
  next: WebsocketTaskKey;
  commPrev: string;
  commNext: string;
  timestamp: bigint;
  cpu: number;
  prevIsKthread: boolean;
  nextIsKthread: boolean;
};

export function isSchedEvent(obj: any): obj is SchedEvent {
  return (
    obj !== null &&
    typeof obj === "object" &&
    isWebsocketTaskKey(obj.prev) &&
    isWebsocketTaskKey(obj.next) &&
    typeof obj.commPrev === "string" &&
    typeof obj.commNext === "string" &&
    typeof obj.timestamp === "number" &&
    typeof obj.cpu === "number" &&
    typeof obj.prevIsKthread === "boolean" &&
    typeof obj.nextIsKthread === "boolean"
  );
}

export type SchedCap = {
  events: SchedEvent[];
};

export function isSchedCap(obj: any): obj is SchedCap {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Array.isArray(obj.events) &&
    obj.events.every((event: any) => isSchedEvent(event))
  );
}
