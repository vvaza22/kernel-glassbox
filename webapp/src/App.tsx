import { useEffect } from "react";
import { useWSStore } from "@/stores/ws";
import { debug } from "@/helpers/logger";
import ProctreeViewer from "@/features/ProctreeViewer.tsx";

/* Localisation */
import "@/localisation/i18n";

/* Tailwind + shadcn UI styles */
import "@/shadcn/styles/app.css";

export default function App() {
  const connect = useWSStore((s) => s.connect);
  const disconnect = useWSStore((s) => s.disconnect);

  useEffect(() => {
    debug("App mounted, connecting to WS...");
    connect();
    return () => {
      debug("App unmounted, disconnecting from WS...");
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div className="h-screen w-screen relative">
      <ProctreeViewer />
    </div>
  );
}
