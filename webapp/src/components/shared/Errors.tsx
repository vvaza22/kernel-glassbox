import { toast, Toaster } from "sonner";
import useErrors from "@/hooks/errors";
import { useEffect } from "react";
import { error } from "@/helpers/logger";

export default function Errors() {
  const { wsError, errorIndex } = useErrors();

  useEffect(() => {
    if (!wsError) return;
    error("WS Error:", wsError, errorIndex);
    toast.error(`Server Error: ${wsError}`);
  }, [wsError, errorIndex]);

  return <Toaster />;
}
