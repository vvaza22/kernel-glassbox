import { cn } from "@/shadcn/lib/utils";
import { Position, Handle } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { SubNodeData } from "@/types/ui/proctree";
import { SearchCode } from "lucide-react";
import { LEADER_BASE_WIDTH, SUB_NODE_HEIGHT } from "@/config/proctree";
import { Link } from "wouter";
import { Badge } from "@/shadcn/components/ui/badge";

export default function SubNode({ data }: NodeProps<Node<SubNodeData>>) {
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
