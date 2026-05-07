import type { ProctreeNode, TaskKey } from "@/types/ws/proctree";
import type {
  SubTreeNode,
  TreeNode,
  Pos,
  LeaderNodeData,
  SubNodeData,
} from "@/types/ui/proctree";
import { type Node, type Edge, Position } from "@xyflow/react";
import {
  LEADER_BASE_HEIGHT,
  SUB_NODE_HEIGHT,
  SUB_NODES_GAP,
} from "@/config/proctree";

const toId = (key: TaskKey) => `${key.pid}-${key.startTime}`;
export const kernelId = toId({ pid: 0, startTime: 0 });

const isGroupLeader = (node: ProctreeNode) => {
  // A thread is a group leader, iff its self id matches its group leader id
  return toId(node.self) === toId(node.groupLeader);
};

/**
 * mapTidToTgid maps thread ID to thread group ID
 */
const mapTidToTgid = (nodes: ProctreeNode[]): Map<string, string> =>
  new Map<string, string>(
    nodes.map((node) => [toId(node.self), toId(node.groupLeader)]),
  );

/**
 * mapTgidToNodes maps thread group leader ID to its threads
 */
const mapTgidToNodes = (nodes: ProctreeNode[]): Map<string, ProctreeNode[]> => {
  const result = new Map<string, ProctreeNode[]>();
  nodes.forEach((node) => {
    const tgid = toId(node.groupLeader);
    if (!result.has(tgid)) {
      result.set(tgid, []);
    }
    result.get(tgid)!.push(node);
  });
  return result;
};

/**
 * mapTgidToChildTgids maps thread group ID to its child thread group IDs
 */
const mapTgidToChildTgids = (
  nodes: ProctreeNode[],
  tidToTgid: Map<string, string>,
): Map<string, string[]> => {
  const result = new Map<string, string[]>();
  nodes.forEach((node) => {
    const selfId = toId(node.self);
    const realParentId = toId(node.realParent);
    const realParentTgid = tidToTgid.get(realParentId) || realParentId;
    if (!result.has(realParentTgid)) {
      result.set(realParentTgid, []);
    }
    result.get(realParentTgid)!.push(selfId);
  });
  return result;
};

const toSubTreeNode = (node: ProctreeNode): SubTreeNode => ({
  id: toId(node.self),
  name: node.name,
  pid: node.self.pid,
});

/**
 * toTreeNodes converts a list of ProctreeNodes to a list of TreeNodes
 * Result always contains a root node as the first element
 */
export function toTreeNodes(nodes: ProctreeNode[]): TreeNode[] {
  const groupLeaders = nodes.filter(isGroupLeader);
  const childThreads = nodes.filter((node) => !isGroupLeader(node));

  const tidToTgid = mapTidToTgid(nodes);
  const tgidToNodes = mapTgidToNodes(childThreads);
  const tgidToChildTgids = mapTgidToChildTgids(groupLeaders, tidToTgid);

  const kernelNode: TreeNode = {
    id: kernelId,
    parentId: "",
    parentTreeNodeId: "",
    name: "swapper",
    pid: 0,
    subNodes: [],
    childTreeNodeIds: tgidToChildTgids.get(kernelId) || [],
  };

  const mainNodes = groupLeaders.map((node): TreeNode => {
    const selfId = toId(node.self);
    const realParentId = toId(node.realParent);
    const realParentTgid = tidToTgid.get(realParentId) || realParentId;
    const subNodes = (tgidToNodes.get(selfId) || []).map(toSubTreeNode);
    const childTreeNodeIds = tgidToChildTgids.get(selfId) || [];
    return {
      id: selfId,
      parentId: realParentId,
      parentTreeNodeId: realParentTgid,
      name: node.name,
      pid: node.self.pid,
      subNodes: subNodes,
      childTreeNodeIds: childTreeNodeIds,
    };
  });

  return [kernelNode, ...mainNodes];
}

/**
 * toFlowNodes converts TreeNodes to React Flow Nodes and Edges
 */
export function toFlowNodes(
  treeNodes: TreeNode[],
  posMap: Map<string, Pos>,
  toggleExpand: (id: string) => void,
  isExpanded: (id: string) => boolean,
): {
  flowNodes: Node[];
  flowEdges: Edge[];
} {
  const flowNodes: Node<LeaderNodeData>[] = treeNodes.map((node) => ({
    id: node.id,
    type: "leader",
    data: {
      id: node.id,
      name: node.name,
      pid: node.pid,
      numSubNodes: node.subNodes.length,
      hasChildren: node.childTreeNodeIds.length > 0,
      expanded: isExpanded(node.id),
      onExpandToggle: toggleExpand,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
    position: {
      x: posMap.get(node.id)?.x || 0,
      y: posMap.get(node.id)?.y || 0,
    },
  }));

  const flowSubNodes: Node<SubNodeData>[] = treeNodes.flatMap((node) => {
    return node.subNodes.map((subNode, rankIndex) => ({
      id: subNode.id,
      type: "sub",
      data: {
        name: subNode.name,
        pid: subNode.pid,
      },
      position: {
        x: 0,
        y: LEADER_BASE_HEIGHT + SUB_NODES_GAP + rankIndex * SUB_NODE_HEIGHT,
      },
      parentId: node.id,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      extent: "parent",
      draggable: false,
    }));
  });

  const flowEdges = treeNodes
    .filter((node) => node.id !== kernelId)
    .map((node) => ({
      id: `${node.parentId}--${node.id}`,
      source: node.parentId,
      target: node.id,
    }));

  return {
    flowNodes: [...flowNodes, ...flowSubNodes],
    flowEdges,
  };
}
