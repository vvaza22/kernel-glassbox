import type { WebsocketTaskKey } from "./shared";
import { isWebsocketTaskKey } from "./shared";

export type WebsocketSchedEvent = {
  prev: WebsocketTaskKey;
  next: WebsocketTaskKey;
  commPrev: string;
  commNext: string;
  timestamp: string;
  cpu: number;
  prevIsKthread: boolean;
  nextIsKthread: boolean;
};

export function isSchedEvent(obj: any): obj is WebsocketSchedEvent {
  return (
    obj !== null &&
    typeof obj === "object" &&
    isWebsocketTaskKey(obj.prev) &&
    isWebsocketTaskKey(obj.next) &&
    typeof obj.commPrev === "string" &&
    typeof obj.commNext === "string" &&
    typeof obj.timestamp === "string" &&
    typeof obj.cpu === "number" &&
    typeof obj.prevIsKthread === "boolean" &&
    typeof obj.nextIsKthread === "boolean"
  );
}

export type WebsocketSchedCap = {
  events: WebsocketSchedEvent[];
};

export function isSchedCap(obj: any): obj is WebsocketSchedCap {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Array.isArray(obj.events) &&
    obj.events.every((event: any) => isSchedEvent(event))
  );
}
