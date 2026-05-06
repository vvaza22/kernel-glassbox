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
import { useMemo, useState, useEffect } from "react";
import type { Node, Edge, NodeProps } from "@xyflow/react";
import type { TreeNode } from "@/types/ui/proctree";
import { kernelId } from "@/adapters/proctree";
import { getLayout } from "@/helpers/flextree";
import { toFlowNodes } from "@/adapters/proctree";
import { bfsExpandedNodes } from "@/helpers/flextree";
import { cn } from "@/shadcn/lib/utils";
import { Minus, Plus, SearchCode } from "lucide-react";

const LEADER_BASE_WIDTH = 300;
const LEADER_BASE_HEIGHT = 50;
const SUB_NODE_HEIGHT = 30;
const SUB_NODES_GAP = 10;
const MIN_VERTICAL_SPACE_BETWEEN_NODES = 50;
const HORIZONTAL_SPACE_BETWEEN_NODES = 50;

function verticalSpacer(numChildren: number) {
  return MIN_VERTICAL_SPACE_BETWEEN_NODES * Math.min(15, numChildren);
}

function leaderDims(numSubNodes: number): [number, number] {
  return [
    LEADER_BASE_WIDTH,
    LEADER_BASE_HEIGHT +
      numSubNodes * SUB_NODE_HEIGHT +
      2 * SUB_NODES_GAP * Math.min(1, numSubNodes),
  ];
}

function SubNode({ data }: NodeProps) {
  return (
    <div
      style={{
        width: LEADER_BASE_WIDTH,
        height: SUB_NODE_HEIGHT,
      }}
      className={cn(
        "relative flex items-center px-3",
        "hover:bg-accent hover:text-accent-foreground cursor-pointer",
      )}
    >
      <div className="truncate w-full text-sm">{String(data.name)}</div>
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-mono leading-none",
          "border-border bg-muted text-muted-foreground whitespace-nowrap",
        )}
      >
        PID {String(data.pid)}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground"
      />
    </div>
  );
}

function LeaderNode({ data }: NodeProps) {
  const hasChildren = data.hasChildren as boolean;
  const expanded = data.expanded as boolean;
  const onExpandToggle = data.onExpandToggle as (id: unknown) => void;
  const numSubNodes = data.numSubNodes as number;

  const [width, height] = leaderDims(data.numSubNodes as number);

  const isRoot = data.pid === 0;

  return (
    <div
      style={{
        width: width,
        height: height,
      }}
      className={cn(
        "relative",
        "border border-border rounded-lg shadow-md",
        "bg-card text-card-foreground bg-muted/10",
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
          "bg-muted/30",
          numSubNodes > 0
            ? "border-b border-border rounded-t-lg"
            : "rounded-lg",
        )}
      >
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "flex items-center justify-center",
              "px-1.5 py-0.5",
              "border border-border rounded-full",
              "text-[10px] font-mono leading-none",
              "bg-background text-muted-foreground whitespace-nowrap",
            )}
          >
            PID {String(data.pid)}
          </span>
          <div className="truncate font-mono text-sm font-semibold">
            {String(data.name)}
          </div>
        </div>

        {!isRoot && (
          <div className="flex items-center flex-shrink-0 text-muted-foreground gap-1">
            <button
              className={cn(
                "p-1 rounded-md cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <SearchCode className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            "!w-6 !h-6 !flex !items-center !justify-center !cursor-pointer",
            "!bg-background !border-muted-foreground !border-1",
          )}
          onPointerDown={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onExpandToggle(data.id);
            }
          }}
        >
          <span className="text-foreground text-sm pointer-events-none">
            {expanded ? (
              <Minus className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
          </span>
        </Handle>
      )}
    </div>
  );
}

type ViewerProps = {
  treeNodes: TreeNode[];
};

export default function Viewer({ treeNodes }: ViewerProps) {
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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeTypes = useMemo(() => ({ leader: LeaderNode, sub: SubNode }), []);

  useEffect(() => {
    const expandedNodes = bfsExpandedNodes(treeNodes, isExpanded);
    const posMap = getLayout(
      expandedNodes,
      leaderDims,
      verticalSpacer,
      HORIZONTAL_SPACE_BETWEEN_NODES,
    );
    const { flowNodes, flowEdges } = toFlowNodes(
      expandedNodes,
      posMap,
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
