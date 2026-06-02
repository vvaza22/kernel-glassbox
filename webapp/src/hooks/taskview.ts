import { useEffect, useState } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType, WSStatus } from "@/types/ws";
import { error } from "@/helpers/logger";
import type { WebsocketTaskKey } from "@/types/ws/shared";
import {
  isWebsocketTaskviewData,
  type WebsocketTaskviewData,
} from "@/types/ws/taskview";

export default function useTaskview() {
  const subscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);
  const status = useWSStore((s) => s.status);

  const [viewData, setViewData] = useState<WebsocketTaskviewData | null>(null);

  const handler = (data: unknown) => {
    if (!isWebsocketTaskviewData(data)) {
      error("Received invalid taskview data:", data);
      return;
    }
    setViewData(data);
  };

  const getView = (key: WebsocketTaskKey) => {
    send({
      type: WSMsgType.WSMsgClientReqTaskview,
      payload: key,
    });
  };

  useEffect(() => {
    if (status !== WSStatus.Connected) return;
    const unsubscribe = subscribe(WSMsgType.WSMsgSrvTaskviewData, handler);

    return () => {
      unsubscribe();
    };
  }, [status, subscribe]);

  return { getView, viewData, connected: status === WSStatus.Connected };
}
