import type { TaskKey } from "./shared";
import { isTaskKey } from "./shared";

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
