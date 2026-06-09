import { Button } from "@/shadcn/components/ui/button";
import useSchedhook from "@/hooks/schedhook";
import EventTimeline from "@/components/schedhook/EventTimeline";
import "@/styles/schedhook.css";
import BackLink from "@/components/shared/BackLink";

export default function Schedhook() {
  const { startCapture, endCapture, events } = useSchedhook();

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackLink />
      </div>
      <h1 className="text-2xl font-bold font-mono">Scheduler Visualizer</h1>
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
        <EventTimeline events={events} />
      </div>
    </div>
  );
}
