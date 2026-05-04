import { useEffect } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType } from "@/types/ws";
import { debug, error } from "@/helpers/logger";
import { isProctreeNodeArray } from "@/types/ws/proctree";

export default function useProctree() {
  const subscribe = useWSStore((s) => s.subscribe);
  useEffect(() => {
    const handler = (data: unknown) => {
      if (!isProctreeNodeArray(data)) {
        error("Received invalid proctree data:", data);
        return;
      }
    };

    const unsubscribe = subscribe(WSMsgType.WSMsgSrvProctreeDump, handler);

    return () => {
      unsubscribe();
    };
  }, [subscribe]);
}
