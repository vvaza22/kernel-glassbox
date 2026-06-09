import type { WebsocketTaskKey } from "./shared";

export const VME_UNSPEC_INDEX: number = -1;

export type WebsocketVMEntry = {
  index: number;
  rawValue: string;
  pa: string;
  kernelVA: string;
  userVAStart: string;
  userVAEnd: string;
  size: string;
  leaf: boolean;
  present: boolean;
  bad: boolean;
  none: boolean;
};

export function isWebsocketVMEntry(obj: any): obj is WebsocketVMEntry {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.rawValue === "string" &&
    typeof obj.pa === "string" &&
    typeof obj.kernelVA === "string" &&
    typeof obj.userVAStart === "string" &&
    typeof obj.userVAEnd === "string" &&
    typeof obj.size === "string" &&
    typeof obj.leaf === "boolean" &&
    typeof obj.present === "boolean" &&
    typeof obj.bad === "boolean" &&
    typeof obj.none === "boolean"
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
  key: WebsocketTaskKey;
  path: VMEPath;
};
