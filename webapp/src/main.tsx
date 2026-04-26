import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { WebSocketProvider } from "./context/WebSocketContext.tsx";
import { WS_URL } from "./config/config.ts";
import { LoggerProvider } from "./context/LoggerContext.tsx";
import { LogLevel } from "./types/logger.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoggerProvider logLevel={LogLevel.DEBUG}>
      <WebSocketProvider url={WS_URL}>
        <App />
      </WebSocketProvider>
    </LoggerProvider>
  </StrictMode>,
);
