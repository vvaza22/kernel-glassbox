export enum WSMsgType {
  // Server => Client messages [1, 1000]
  WSMsgSrvError = 1,
  WSMsgSrvProctreeDump,
  WSMsgSrvSchedhookCap,
  WSMsgSrvVMEDump,

  // Client => Server messages [1001, +inf]
  WSMsgClientReqProctreeDump = 1001,
  WSMSgClientReqSchedhookCapStart,
  WSMsgClientReqSchedhookCapEnd,
  WSMsgClientReqVMEDump,
}

export interface WSMessage {
  type: WSMsgType;
  payload: any;
}

export type ListenerFn = (payload: any) => void;

export function isWSMessage(obj: any): obj is WSMessage {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.type === "number" &&
    "payload" in obj
  );
}

export enum WSStatus {
  Disconnected,
  Connecting,
  Connected,
  Error,
}
