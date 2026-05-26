import type { TaskKey } from "../ws/shared";

export type SchedTask = {
  key: TaskKey;
  name: string;
  cpu: number;
  start: bigint;
  end: bigint;
  startNorm: bigint;
  endNorm: bigint;
  startLog: bigint;
  endLog: bigint;
  duration: bigint;
  kthread: boolean;
};
