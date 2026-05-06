import { useEffect, useState } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType, WSStatus } from "@/types/ws";
import { debug, error } from "@/helpers/logger";
import { isProctreeNodeArray } from "@/types/ws/proctree";
import type { TreeNode } from "@/types/ui/proctree";
import { toTreeNodes } from "@/adapters/proctree";

export default function useProctree() {
  const subscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);
  const status = useWSStore((s) => s.status);

  // Was the first message received?
  const [loaded, setLoaded] = useState(false);
  const [nodes, setNodes] = useState<TreeNode[]>([]);

  const handler = (data: unknown) => {
    if (!isProctreeNodeArray(data)) {
      error("Received invalid proctree data:", data);
      return;
    }

    const newNodes = toTreeNodes(data);
    debug("Transformed proctree dump data:", newNodes);
    setNodes(newNodes);

    // The initial data was received
    setTimeout(() => {
      setLoaded(true);
    }, 1000);
  };

  useEffect(() => {
    if (status !== WSStatus.Connected) return;
    const unsubscribe = subscribe(WSMsgType.WSMsgSrvProctreeDump, handler);

    // Request the initial proctree dump on connect
    send({
      type: WSMsgType.WSMsgClientReqProctreeDump,
      payload: null,
    });

    return () => {
      unsubscribe();
    };
  }, [status, subscribe, send]);

  return { loaded, nodes };
}
