import { useEffect, useState } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType, WSStatus } from "@/types/ws";
import { error } from "@/helpers/logger";
import { isSchedCap } from "@/types/ws/schedhook";
import type { SchedEvent } from "@/types/ui/schedhook";
import { toSchedEvents } from "@/adapters/schedhook";

export default function useSchedhook() {
  const subscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);
  const status = useWSStore((s) => s.status);

  const [events, setEvents] = useState<SchedEvent[]>([]);

  const handler = (data: unknown) => {
    if (!isSchedCap(data)) {
      error("Received invalid schedhook capture data", data);
      return;
    }
    setEvents(toSchedEvents(data.events));
  };

  const startCapture = () => {
    send({
      type: WSMsgType.WSMSgClientReqSchedhookCapStart,
      payload: null,
    });
  };

  const endCapture = () => {
    send({
      type: WSMsgType.WSMsgClientReqSchedhookCapEnd,
      payload: null,
    });
  };

  useEffect(() => {
    if (status !== WSStatus.Connected) return;
    const unsubscribe = subscribe(WSMsgType.WSMsgSrvSchedhookCap, handler);

    return () => {
      unsubscribe();
    };
  }, [status, subscribe]);

  return { startCapture, endCapture, events };
}
