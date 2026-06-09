import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
} from "@xyflow/react";
import { useMemo, useState, useEffect, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { TreeNode, Pos } from "@/types/ui/proctree";
import { kernelId } from "@/adapters/proctree";
import {
  getLayout,
  leaderDims,
  verticalSpacer,
  withinThreshold,
} from "@/helpers/flextree";
import { toFlowNodes } from "@/adapters/proctree";
import { bfsExpandedNodes } from "@/helpers/flextree";
import {
  HORIZONTAL_SPACE_BETWEEN_NODES,
  NODE_POS_EQUALITY_THRESHOLD,
} from "@/config/proctree";
import LeaderNode from "./LeaderNode";
import SubNode from "./SubNode";

type ViewerProps = {
  treeNodes: TreeNode[];
};

export default function Viewer({ treeNodes }: ViewerProps) {
  const nodeTypes = useMemo(() => ({ leader: LeaderNode, sub: SubNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // TODO: Implement expanded state cleaning after rerender
  const [expanded, setExpanded] = useState(new Set<string>([kernelId]));
  const isExpanded = (id: string) => expanded.has(id);
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Suggested layout from the algorithm on the last render
  const prevSuggestedLayout = useRef<Map<String, Pos>>(new Map());
  // New layout after user drags nodes around
  const userDefinedLayout = useRef<Map<String, Pos>>(new Map());

  const handleNodeDragStop = (_: React.MouseEvent, node: Node) => {
    userDefinedLayout.current.set(node.id, {
      x: node.position.x,
      y: node.position.y,
    });
  };

  const getFinalLayout = (suggestedLayout: Map<string, Pos>) => {
    const finalLayout = new Map<string, Pos>();

    suggestedLayout.forEach((cur, id) => {
      const userPos = userDefinedLayout.current.get(id);
      if (!userPos) {
        // User has not moved this node, use the algorithm's suggestion
        finalLayout.set(id, cur);
        return;
      }
      const prev = prevSuggestedLayout.current.get(id);
      if (withinThreshold(prev, cur, NODE_POS_EQUALITY_THRESHOLD)) {
        // Algorithm suggests the same position as previously, use user's position
        finalLayout.set(id, userPos);
        return;
      }
      // Node was moved by the algorithm, need to reset user's position
      finalLayout.set(id, cur);
      userDefinedLayout.current.delete(id);
    });

    prevSuggestedLayout.current = suggestedLayout;

    return finalLayout;
  };

  useEffect(() => {
    const expandedNodes = bfsExpandedNodes(treeNodes, isExpanded);
    const suggestedLayout = getLayout(
      expandedNodes,
      leaderDims,
      verticalSpacer,
      HORIZONTAL_SPACE_BETWEEN_NODES,
    );
    const { flowNodes, flowEdges } = toFlowNodes(
      expandedNodes,
      getFinalLayout(suggestedLayout),
      toggleExpand,
      isExpanded,
    );
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [treeNodes, expanded]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={handleNodeDragStop}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      nodesConnectable={false}
      colorMode="dark"
    >
      <Background />
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
}
