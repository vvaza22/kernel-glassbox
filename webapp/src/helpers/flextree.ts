import type { TreeNode, Pos } from "@/types/ui/proctree";
import type { NestedNode } from "@/types/flextree";
import { flextree } from "d3-flextree";
import type { FlextreeNode } from "d3-flextree";

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
