import { useTranslation } from "react-i18next";
import useProctree from "@/hooks/proctree";
import Loader from "@/components/shared/Loader";
import "@xyflow/react/dist/style.css";
import Viewer from "@/components/proctree/Viewer";
import { cn } from "@/shadcn/lib/utils";
import { PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/shadcn/components/ui/button";
import { Link } from "wouter";

export default function Proctree() {
  const { t } = useTranslation("proctree");
  const { loaded, paused, setPaused, nodes, timeFormatted } = useProctree();

  const togglePause = () => {
    setPaused((prev) => !prev);
  };

  return loaded ? (
    <div className="w-full h-full">
      <div className={cn("fixed top-0 right-0 p-4 z-100")}>
        <Link href="/schedhook">
          <Button variant="outline" className="cursor-pointer">
            Scheduler Visualizer
          </Button>
        </Link>
      </div>
      <div
        className={cn("fixed top-0 left-0", "p-4 bg-background/50", "z-100")}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono leading-none">
            {timeFormatted}
          </span>
          <span className="cursor-pointer" onClick={togglePause}>
            {paused ? (
              <PlayCircle
                size={20}
                className="text-zinc-200 hover:text-green-400"
              />
            ) : (
              <PauseCircle
                size={20}
                className="text-zinc-200 hover:text-red-400"
              />
            )}
          </span>
        </div>
      </div>
      <Viewer treeNodes={nodes} />
    </div>
  ) : (
    <Loader label={t("loading")} />
  );
}
