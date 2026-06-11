export type WebsocketTaskKey = {
  pid: string;
  startTime: string;
};

export function isWebsocketTaskKey(obj: any): obj is WebsocketTaskKey {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.pid === "string" &&
    typeof obj.startTime === "string"
  );
}

export type WebsocketError = {
  message: string;
};

export function isWebsocketError(obj: any): obj is WebsocketError {
  return (
    obj !== null && typeof obj === "object" && typeof obj.message === "string"
  );
}
