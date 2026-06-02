import { useEffect, useState } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType, WSStatus } from "@/types/ws";
import { debug, error } from "@/helpers/logger";
import { isWebsocketProctreeDump } from "@/types/ws/proctree";
import type { TreeNode } from "@/types/ui/proctree";
import { toTreeNodes } from "@/adapters/proctree";

export default function useProctree() {
  const subscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);
  const status = useWSStore((s) => s.status);

  // Was the first message received?
  const [loaded, setLoaded] = useState(false);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [timeFormatted, setTimeFormatted] = useState("");
  const [paused, setPaused] = useState(false);

  const handler = (data: unknown) => {
    if (!isWebsocketProctreeDump(data)) {
      error("Received invalid proctree data:", data);
      return;
    }

    const newNodes = toTreeNodes(data.nodes);
    debug("Transformed proctree dump data:", newNodes);
    setNodes(newNodes);
    setTimeFormatted(data.timeFormatted);

    // The initial data was received
    setLoaded(true);
  };

  useEffect(() => {
    if (paused) return;
    if (status !== WSStatus.Connected) return;
    const unsubscribe = subscribe(WSMsgType.WSMsgSrvProctreeDump, handler);

    send({
      type: WSMsgType.WSMsgClientReqProctreeDump,
      payload: null,
    });

    return () => {
      unsubscribe();
    };
  }, [status, subscribe, paused, send]);

  return { loaded, paused, setPaused, nodes, timeFormatted };
}
