export enum WSMsgType {
  // Server => Client messages [1, 1000]
  WSMsgSrvError = 1,
  WSMsgSrvProctreeDump,

  // Client => Server messages [1001, +inf]
  WSMsgClientReqProctreeDump = 1001,
}

export interface WSMessage<T = any> {
  type: WSMsgType;
  payload: T;
}
