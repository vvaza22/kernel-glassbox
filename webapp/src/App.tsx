import { useEffect } from "react";
import { useWebSocket } from "./context/WebSocketContext.tsx";
import { WSMsgType } from "./types/ws";

export default function App() {
  const { sendMessage } = useWebSocket();

  useEffect(() => {
    const timer = setInterval(() => {
      sendMessage({
        type: WSMsgType.WSMsgClientReqProctreeDump,
        payload: { text: "Hello, Go!" },
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [sendMessage]);

  return <div style={{ width: "100vw", height: "100vh" }}></div>;
}
