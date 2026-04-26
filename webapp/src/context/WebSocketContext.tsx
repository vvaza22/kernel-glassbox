import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WSMessage, WSMsgType } from "../types/ws";
import { useLogger } from "./LoggerContext";

type ListenerFn = (payload: any) => void;

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: <T>(msg: WSMessage<T>) => void;
  subscribe: (type: WSMsgType, callback: ListenerFn) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{
  url: string;
  children: ReactNode;
}> = ({ url, children }) => {
  const { debug, error } = useLogger();

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Map<WSMsgType, Set<ListenerFn>>());

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      debug("WS connected");
    };

    ws.onclose = () => {
      setIsConnected(false);
      debug("WS disconnected");
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        debug("Received WS message:", message);
      } catch (err) {
        error("Failed to parse WS message:", err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [url]);

  const sendMessage = <T,>(msg: WSMessage<T>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      error("WS not connected. Failed to send message:", msg);
    }
  };

  const subscribe = (type: WSMsgType, callback: ListenerFn) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(callback);

    // Return an unsubscribe function
    return () => {
      listenersRef.current.get(type)?.delete(callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
