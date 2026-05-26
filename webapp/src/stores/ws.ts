import { create } from "zustand";
import type { WSMessage, WSMsgType, ListenerFn } from "@/types/ws";
import { isWSMessage, WSStatus } from "@/types/ws";
import { WS_URL } from "@/config/config";
import { debug, error, warn } from "@/helpers/logger";
import JSONBig from "json-bigint";

type WSStore = {
  socket: WebSocket | null;
  status: WSStatus;
  connect: () => void;
  disconnect: () => void;
  send: (data: WSMessage) => void;
  subscribe: (msgType: WSMsgType, callback: ListenerFn) => () => void;
};

export const useWSStore = create<WSStore>((set, get) => {
  const listeners = new Map<WSMsgType, Set<ListenerFn>>();
  const handleMsg = (data: WSMessage) => {
    const msgListeners = listeners.get(data.type);
    if (msgListeners) {
      msgListeners.forEach((listener) => listener(data.payload));
    }
  };

  return {
    socket: null,
    status: WSStatus.Disconnected,

    connect: () => {
      if (get().socket || get().status === WSStatus.Connecting) {
        error("Connect failed: already connected or connecting");
        return;
      }

      const socket = new WebSocket(WS_URL);
      set({ socket: socket, status: WSStatus.Connecting });
      debug("Attempting WS connection to", WS_URL);

      socket.onopen = () => {
        debug("WS connected");
        set({ status: WSStatus.Connected });
      };

      socket.onclose = () => {
        debug("WS disconnected");
      };

      socket.onerror = (err) => {
        error("WS error:", err);
      };

      socket.onmessage = (event) => {
        let data: unknown;

        try {
          data = JSONBig({
            useNativeBigInt: true,
          }).parse(event.data);
        } catch (err) {
          error("Failed to parse WS message:", err);
          return;
        }

        if (!isWSMessage(data)) {
          error("Received invalid WS message:", data);
          return;
        }

        debug("Received WS message:", data);

        handleMsg(data);
      };
    },

    disconnect: () => {
      const socket = get().socket;
      if (!socket) {
        error("Disconnect failed: no active WS connection");
        return;
      }

      if (socket.readyState !== WebSocket.OPEN) {
        warn(
          "Disconnecting WS that is not in OPEN state. State:",
          socket.readyState,
        );
      }

      // Remove every handler to prevent state updates after disconnect
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;

      socket.close();
      set({ socket: null, status: WSStatus.Disconnected });
    },

    send: (msg) => {
      const socket = get().socket;
      if (!socket) {
        error("Send failed: no active WS connection");
        return;
      }

      debug("Sending WS message:", msg);

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSONBig({
            useNativeBigInt: true,
          }).stringify(msg),
        );
      }
    },

    subscribe: (msgType, callback) => {
      debug("Subscribing to WS message type", msgType);

      if (!listeners.has(msgType)) {
        listeners.set(msgType, new Set());
      }
      listeners.get(msgType)!.add(callback);

      // Return an unsubscribe function
      return () => {
        debug("Unsubscribing from WS message type", msgType);
        listeners.get(msgType)?.delete(callback);
      };
    },
  };
});
