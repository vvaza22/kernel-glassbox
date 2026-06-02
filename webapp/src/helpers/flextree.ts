import type { TreeNode, Pos } from "@/types/ui/proctree";
import type { NestedNode } from "@/types/flextree";
import { flextree } from "d3-flextree";
import type { FlextreeNode } from "d3-flextree";
import {
  LEADER_BASE_WIDTH,
  LEADER_BASE_HEIGHT,
  SUB_NODE_HEIGHT,
  SUB_NODES_GAP,
  MIN_VERTICAL_SPACE_BETWEEN_NODES,
  VERTICAL_SPACE_GROWTH_CAP,
} from "@/config/proctree";

function toNestedNode(
  nodes: TreeNode[],
  nodeDims: (numSubNodes: number) => [number, number],
): NestedNode {
  const idToNode = new Map<string, TreeNode>(
    nodes.map((node) => [node.id, node]),
  );

  const buildChildNode = (childNodeId: string): NestedNode | null => {
    const childNode = idToNode.get(childNodeId);
    if (!childNode) return null;
    return recBuild(childNode);
  };

  const recBuild = (root: TreeNode): NestedNode => {
    const [w, h] = nodeDims(root.subNodes.length);
    return {
      id: root.id,
      numSubNodes: root.subNodes.length,
      children: root.childTreeNodeIds
        .map(buildChildNode)
        .filter((n): n is NestedNode => n !== null),
      width: w,
      height: h,
    };
  };

  return recBuild(nodes[0]);
}

function toPosMap(node: FlextreeNode<NestedNode>): Map<string, Pos> {
  const result = new Map<string, Pos>();

  const unpack = (root: FlextreeNode<NestedNode>) => {
    result.set(root.data.id, {
      x: root.x - root.data.width / 2,
      y: root.y,
    });
    root.children?.forEach(unpack);
  };
  unpack(node);

  return result;
}

export function bfsExpandedNodes(
  nodes: TreeNode[],
  isExpanded: (id: string) => boolean,
): TreeNode[] {
  const idToNode = new Map<string, TreeNode>(
    nodes.map((node) => [node.id, node]),
  );
  let result: TreeNode[] = [];
  let queue: TreeNode[] = [nodes[0]];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) break;
    result.push(node);
    if (isExpanded(node.id)) {
      const childNodes = node.childTreeNodeIds
        .map((id) => idToNode.get(id))
        .filter((n): n is TreeNode => n !== undefined);
      queue.push(...childNodes);
    }
  }

  return result;
}

export function getLayout(
  nodes: TreeNode[],
  nodeDims: (numSubNodes: number) => [number, number],
  vSpacer: (numChildren: number) => number,
  hSpacing: number,
): Map<string, Pos> {
  const nested = toNestedNode(nodes, nodeDims);
  const layout = flextree<NestedNode>({
    children: (d) => d.children,
    nodeSize: (node) => {
      return [
        node.data.width,
        node.data.height + vSpacer(node.data.children.length),
      ];
    },
    spacing: hSpacing,
  });
  const tree = layout.hierarchy(nested);
  layout(tree);
  return toPosMap(tree);
}

export function withinThreshold(
  pos1: Pos | undefined,
  pos2: Pos | undefined,
  threshold: number,
) {
  if (!pos1 || !pos2) return false;
  return (
    Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y)) < threshold
  );
}

export function verticalSpacer(numChildren: number) {
  return (
    MIN_VERTICAL_SPACE_BETWEEN_NODES *
    Math.min(VERTICAL_SPACE_GROWTH_CAP, numChildren)
  );
}

export function leaderDims(numSubNodes: number): [number, number] {
  return [
    LEADER_BASE_WIDTH,
    LEADER_BASE_HEIGHT +
      numSubNodes * SUB_NODE_HEIGHT +
      2 * SUB_NODES_GAP * Math.min(1, numSubNodes),
  ];
}
