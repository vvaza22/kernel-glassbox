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
import type {
  LeaderNodeData,
  SubNodeData,
  TreeNode,
  Pos,
} from "@/types/ui/proctree";
import { kernelId } from "@/adapters/proctree";
import { getLayout, withinThreshold } from "@/helpers/flextree";
import { toFlowNodes } from "@/adapters/proctree";
import { bfsExpandedNodes } from "@/helpers/flextree";
import { cn } from "@/shadcn/lib/utils";
import { Minus, Network, Plus, SearchCode } from "lucide-react";
import {
  LEADER_BASE_WIDTH,
  LEADER_BASE_HEIGHT,
  SUB_NODE_HEIGHT,
  SUB_NODES_GAP,
  MIN_VERTICAL_SPACE_BETWEEN_NODES,
  HORIZONTAL_SPACE_BETWEEN_NODES,
  VERTICAL_SPACE_GROWTH_CAP,
  NODE_POS_EQUALITY_THRESHOLD,
} from "@/config/proctree";
import { Link } from "wouter";
import { Badge } from "@/shadcn/components/ui/badge";

function verticalSpacer(numChildren: number) {
  return (
    MIN_VERTICAL_SPACE_BETWEEN_NODES *
    Math.min(VERTICAL_SPACE_GROWTH_CAP, numChildren)
  );
}

function leaderDims(numSubNodes: number): [number, number] {
  return [
    LEADER_BASE_WIDTH,
    LEADER_BASE_HEIGHT +
      numSubNodes * SUB_NODE_HEIGHT +
      2 * SUB_NODES_GAP * Math.min(1, numSubNodes),
  ];
}

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

function LeaderNode({ data }: NodeProps<Node<LeaderNodeData>>) {
  const [width, height] = leaderDims(data.numSubNodes);
  const isRoot = data.pid === "0";

  return (
    <div
      style={{
        width: width,
        height: height,
      }}
      className={cn(
        "relative",
        "border rounded-lg shadow-md",
        "bg-card text-card-foreground bg-muted/10",
        data.isKthread ? "border-red-400/30" : "border-blue-400/30",
      )}
    >
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-muted-foreground"
        />
      )}

      <div
        className={cn(
          "w-full h-[50px] flex items-center justify-between px-3",
          data.isKthread ? "bg-red-950/30" : "bg-blue-950/30",
          data.numSubNodes > 0 ? "border-b  rounded-t-lg" : "rounded-lg",
        )}
      >
        <div className="flex items-center gap-1">
          <Badge
            className={cn(
              "font-mono font-semibold text-[12px] whitespace-nowrap",
              "px-2 py-0.5",
              data.isKthread
                ? "bg-red-950 text-red-300"
                : "bg-blue-950 text-blue-300",
            )}
          >
            <span>{data.pid}</span>
          </Badge>
          <div
            className={cn(
              "truncate font-mono text-sm font-semibold",
              data.isKthread ? "text-red-300" : "text-blue-300",
            )}
          >
            {data.name}
          </div>
        </div>

        {!isRoot && (
          <div className="flex items-center flex-shrink-0 text-muted-foreground gap-1">
            <Link href={`/view/${data.pid}/${data.startTime}`}>
              <button
                className={cn(
                  "p-1 rounded-md cursor-pointer",
                  "transition-colors",
                  data.isKthread
                    ? "text-red-300 hover:bg-red-950 hover:text-red-200"
                    : "text-blue-300 hover:bg-blue-950 hover:text-blue-200",
                )}
              >
                <SearchCode className="w-4 h-4" />
              </button>
            </Link>
            <Link href={`/vm/${data.pid}/${data.startTime}`}>
              <button
                className={cn(
                  "p-1 rounded-md cursor-pointer",
                  "transition-colors",
                  data.isKthread
                    ? "text-red-300 hover:bg-red-950 hover:text-red-200"
                    : "text-blue-300 hover:bg-blue-950 hover:text-blue-200",
                )}
              >
                <Network className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </div>

      {data.hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            "!w-6 !h-6",
            "!flex !items-center !justify-center !cursor-pointer",
            "!border-1",
            data.isKthread
              ? "!bg-zinc-900 !border-red-800"
              : "!bg-zinc-900 !border-blue-800",
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            data.onExpandToggle(data.id);
          }}
        >
          <div
            className={cn(
              "text-sm pointer-events-none",
              data.isKthread ? "text-red-400" : "text-blue-400",
            )}
          >
            {data.expanded ? (
              <Minus className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
          </div>
          <span className="text-foreground text-sm pointer-events-none"></span>
        </Handle>
      )}
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
