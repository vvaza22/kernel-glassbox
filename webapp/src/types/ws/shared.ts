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
