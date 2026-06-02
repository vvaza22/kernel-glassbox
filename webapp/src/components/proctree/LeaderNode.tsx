import { cn } from "@/shadcn/lib/utils";
import { Position, Handle } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { Minus, Network, Plus, SearchCode } from "lucide-react";
import type { LeaderNodeData } from "@/types/ui/proctree";
import { leaderDims } from "@/helpers/flextree";
import { Link } from "wouter";
import { Badge } from "@/shadcn/components/ui/badge";

export default function LeaderNode({ data }: NodeProps<Node<LeaderNodeData>>) {
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
