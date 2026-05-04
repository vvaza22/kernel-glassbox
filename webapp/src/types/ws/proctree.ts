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

export type ProctreeNode = {
  parent: TaskKey;
  realParent: TaskKey;
  groupLeader: TaskKey;
  self: TaskKey;
  name: string;
};

export function isProctreeNode(obj: any): obj is ProctreeNode {
  return (
    obj !== null &&
    typeof obj === "object" &&
    isTaskKey(obj.parent) &&
    isTaskKey(obj.realParent) &&
    isTaskKey(obj.groupLeader) &&
    isTaskKey(obj.self) &&
    typeof obj.name === "string"
  );
}

export function isProctreeNodeArray(obj: any): obj is ProctreeNode[] {
  return Array.isArray(obj) && obj.every((item) => isProctreeNode(item));
}
