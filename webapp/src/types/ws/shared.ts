export type TaskKey = {
  pid: number;
  startTime: number;
};

export function isTaskKey(obj: any): obj is TaskKey {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.pid === "number" &&
    typeof obj.startTime === "number"
  );
}
