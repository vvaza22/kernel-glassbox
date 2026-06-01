import { useEffect, useState } from "react";
import { useWSStore } from "@/stores/ws";
import { WSMsgType, WSStatus } from "@/types/ws";
import { error } from "@/helpers/logger";
import type { TaskKey } from "@/types/ws/shared";
import {
  isWebsocketVMEDump,
  type VMEPath,
  type WebsocketVMEntry,
  type WebsocketVMEReq,
} from "@/types/ws/vmexplorer";

export default function useVME() {
  const subscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);
  const status = useWSStore((s) => s.status);

  const [entries, setEntries] = useState<WebsocketVMEntry[]>([]);

  const handler = (data: unknown) => {
    if (!isWebsocketVMEDump(data)) {
      error("Received invalid VME dump data:", data);
      return;
    }
    setEntries(data.entries);
  };

  const explore = (key: TaskKey, path: VMEPath) => {
    const req: WebsocketVMEReq = {
      key,
      path,
    };
    send({
      type: WSMsgType.WSMsgClientReqVMEDump,
      payload: req,
    });
  };

  useEffect(() => {
    if (status !== WSStatus.Connected) return;
    const unsubscribe = subscribe(WSMsgType.WSMsgSrvVMEDump, handler);

    return () => {
      unsubscribe();
    };
  }, [status, subscribe]);

  return { explore, entries, connected: status === WSStatus.Connected };
}
