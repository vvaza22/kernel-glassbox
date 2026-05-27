import type { TaskKey } from "./shared";

export const VME_UNSPEC_INDEX: number = -1;

export type WebsocketVMEntry = {
  index: number;
  rawValue: string;
  pa: string;
  kernelVA: string;
  userVA: string;
  leaf: boolean;
  present: boolean;
};

export function isWebsocketVMEntry(obj: any): obj is WebsocketVMEntry {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.rawValue === "string" &&
    typeof obj.pa === "string" &&
    typeof obj.kernelVA === "string" &&
    typeof obj.userVA === "string" &&
    typeof obj.leaf === "boolean" &&
    typeof obj.present === "boolean"
  );
}

export type WebsocketVMEDump = {
  entries: WebsocketVMEntry[];
};

export function isWebsocketVMEDump(obj: any): obj is WebsocketVMEDump {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Array.isArray(obj.entries) &&
    obj.entries.every(isWebsocketVMEntry)
  );
}

export type VMEPath = {
  l4: number;
  l3: number;
  l2: number;
  l1: number;
};

export type WebsocketVMEReq = {
  key: TaskKey;
  path: VMEPath;
};
