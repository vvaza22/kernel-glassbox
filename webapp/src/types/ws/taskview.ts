import type { WebsocketTaskKey } from "./shared";

export type WebsocketSchedData = {
  prio: string;
  staticPrio: string;
  normalPrio: string;
  vruntime: string;
  sumExecRuntime: string;
};

export function isWebsocketSchedData(obj: any): obj is WebsocketSchedData {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.prio === "string" &&
    typeof obj.staticPrio === "string" &&
    typeof obj.normalPrio === "string" &&
    typeof obj.vruntime === "string" &&
    typeof obj.sumExecRuntime === "string"
  );
}

export type WebsocketCredData = {
  uid: string;
  gid: string;
  suid: string;
  sgid: string;
  euid: string;
  egid: string;
};

export function isWebsocketCredData(obj: any): obj is WebsocketCredData {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.uid === "string" &&
    typeof obj.gid === "string" &&
    typeof obj.suid === "string" &&
    typeof obj.sgid === "string" &&
    typeof obj.euid === "string" &&
    typeof obj.egid === "string"
  );
}

export type WebsocketMemoryData = {
  mmapBase: string;
  taskSize: string;

  // Page counts
  totalVm: string;
  lockedVm: string;
  dataVm: string;
  execVm: string;
  stackVm: string;

  // Code segment
  startCode: string;
  endCode: string;

  // Data segment
  startData: string;
  endData: string;

  // Heap
  startBrk: string;
  brk: string;

  // Stack
  startStack: string;

  // Arguments
  argStart: string;
  argEnd: string;

  // Environment
  envStart: string;
  envEnd: string;
};

export function isWebsocketMemoryData(obj: any): obj is WebsocketMemoryData {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.mmapBase === "string" &&
    typeof obj.taskSize === "string" &&
    typeof obj.totalVm === "string" &&
    typeof obj.lockedVm === "string" &&
    typeof obj.dataVm === "string" &&
    typeof obj.execVm === "string" &&
    typeof obj.stackVm === "string" &&
    typeof obj.startCode === "string" &&
    typeof obj.endCode === "string" &&
    typeof obj.startData === "string" &&
    typeof obj.endData === "string" &&
    typeof obj.startBrk === "string" &&
    typeof obj.brk === "string" &&
    typeof obj.startStack === "string" &&
    typeof obj.argStart === "string" &&
    typeof obj.argEnd === "string" &&
    typeof obj.envStart === "string" &&
    typeof obj.envEnd === "string"
  );
}

export type WebsocketTaskviewData = {
  // Identity
  pid: string;
  tgid: string;
  startTime: string;
  comm: string;
  parent: WebsocketTaskKey;
  realParent: WebsocketTaskKey;

  // State
  state: string;
  exitState: string;
  exitCode: string;
  exitSignal: string;

  // Security
  stackCanary: string;

  // Creds
  realCreds: WebsocketCredData;

  // Scheduler
  sched: WebsocketSchedData;

  // Memory
  memory: WebsocketMemoryData;
};

export function isWebsocketTaskviewData(
  obj: any,
): obj is WebsocketTaskviewData {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.pid === "string" &&
    typeof obj.tgid === "string" &&
    typeof obj.startTime === "string" &&
    typeof obj.comm === "string" &&
    typeof obj.parent === "object" &&
    typeof obj.realParent === "object" &&
    typeof obj.state === "string" &&
    typeof obj.exitState === "string" &&
    typeof obj.exitCode === "string" &&
    typeof obj.exitSignal === "string" &&
    typeof obj.stackCanary === "string" &&
    isWebsocketCredData(obj.realCreds) &&
    isWebsocketSchedData(obj.sched) &&
    isWebsocketMemoryData(obj.memory)
  );
}
