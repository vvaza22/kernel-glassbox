import { useEffect } from "react";
import { useWSStore } from "@/stores/ws";
import { debug } from "@/helpers/logger";
import Proctree from "@/features/Proctree.tsx";
import { Route, Switch } from "wouter";

/* Localisation */
import "@/localisation/i18n";

/* Tailwind + shadcn UI styles */
import "@/shadcn/styles/app.css";
import Schedhook from "./features/Schedhook";

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
      <Switch>
        <Route path="/">
          <Proctree />
        </Route>
        <Route path="/schedhook">
          <Schedhook />
        </Route>
      </Switch>
    </div>
  );
}
