import { useEffect, useState } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType, WSStatus } from "@/types/ws";
import { debug, error } from "@/helpers/logger";
import { isWebsocketError } from "@/types/ws/shared";

export default function useErrors() {
  const subscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);
  const status = useWSStore((s) => s.status);

  const [wsError, setWsError] = useState<string | null>(null);
  const [errorIndex, setErrorIndex] = useState<number>(0);

  const handler = (data: unknown) => {
    debug("Received WS error:", data);
    if (!isWebsocketError(data)) {
      error("Received invalid WS error data:", data);
      return;
    }
    setWsError(data.message);
    setErrorIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (status !== WSStatus.Connected) return;
    const unsubscribe = subscribe(WSMsgType.WSMsgSrvError, handler);
    return () => {
      unsubscribe();
    };
  }, [status, subscribe, send]);

  return { wsError, errorIndex };
}
