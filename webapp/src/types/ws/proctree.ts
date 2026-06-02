import type { WebsocketTaskKey } from "./shared";
import { isWebsocketTaskKey } from "./shared";

export type ProctreeNode = {
  parent: WebsocketTaskKey;
  realParent: WebsocketTaskKey;
  groupLeader: WebsocketTaskKey;
  self: WebsocketTaskKey;
  name: string;
  isKthread: boolean;
};

export function isProctreeNode(obj: any): obj is ProctreeNode {
  return (
    obj !== null &&
    typeof obj === "object" &&
    isWebsocketTaskKey(obj.parent) &&
    isWebsocketTaskKey(obj.realParent) &&
    isWebsocketTaskKey(obj.groupLeader) &&
    isWebsocketTaskKey(obj.self) &&
    typeof obj.isKthread === "boolean" &&
    typeof obj.name === "string"
  );
}

export function isProctreeNodeArray(obj: any): obj is ProctreeNode[] {
  return Array.isArray(obj) && obj.every((item) => isProctreeNode(item));
}
