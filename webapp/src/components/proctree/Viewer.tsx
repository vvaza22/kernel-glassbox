import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  MiniMap,
  Controls,
} from "@xyflow/react";
import { useMemo, useState, useEffect, useRef } from "react";
import type { Node, Edge, NodeProps } from "@xyflow/react";
import type { SubNodeData, TreeNode, Pos } from "@/types/ui/proctree";
import { kernelId } from "@/adapters/proctree";
import {
  getLayout,
  leaderDims,
  verticalSpacer,
  withinThreshold,
} from "@/helpers/flextree";
import { toFlowNodes } from "@/adapters/proctree";
import { bfsExpandedNodes } from "@/helpers/flextree";
import { cn } from "@/shadcn/lib/utils";
import { SearchCode } from "lucide-react";
import {
  LEADER_BASE_WIDTH,
  SUB_NODE_HEIGHT,
  HORIZONTAL_SPACE_BETWEEN_NODES,
  NODE_POS_EQUALITY_THRESHOLD,
} from "@/config/proctree";
import { Link } from "wouter";
import { Badge } from "@/shadcn/components/ui/badge";
import LeaderNode from "./LeaderNode";

function SubNode({ data }: NodeProps<Node<SubNodeData>>) {
  return (
    <div
      style={{
        width: LEADER_BASE_WIDTH,
        height: SUB_NODE_HEIGHT,
      }}
      className={cn(
        "relative flex items-center px-3",
        "hover:bg-accent/50 hover:text-accent-foreground cursor-pointer",
      )}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex justify-start items-center gap-1">
          <Badge
            variant="outline"
            className="bg-zinc-900 text-sm font-mono text-muted-foreground"
          >
            {data.pid}
          </Badge>
          <div className="truncate w-full text-sm">{data.name}</div>
        </div>
        <Link href={`/view/${data.pid}/${data.startTime}`}>
          <button
            className={cn(
              "p-1 cursor-pointer",
              "transition-colors",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <SearchCode className="w-4 h-4" />
          </button>
        </Link>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground"
      />
    </div>
  );
}

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
