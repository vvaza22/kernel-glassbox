import { Button } from "@/shadcn/components/ui/button";
import useSchedhook from "@/hooks/schedhook";
import EventTimeline from "@/components/schedhook/EventTimeline";
import { toSchedTasks } from "@/adapters/schedhook";
import "@/styles/schedhook.css";

export default function Schedhook() {
  const { startCapture, endCapture, events } = useSchedhook();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold font-mono">Scheduler Visualizer</h1>
      <div className="mt-4 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="cursor-pointer"
            onClick={startCapture}
          >
            Start Capture
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="cursor-pointer"
            onClick={endCapture}
          >
            End Capture
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <EventTimeline events={toSchedTasks(events)} />
      </div>
    </div>
  );
}
