import type { WebsocketTaskKey } from "../ws/shared";

export type SchedTask = {
  key: WebsocketTaskKey;
  name: string;
  cpu: number;
  start: bigint;
  end: bigint;
  startNorm: bigint;
  endNorm: bigint;
  duration: bigint;
  kthread: boolean;
};
