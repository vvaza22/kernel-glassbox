import type { WebsocketTaskviewData } from "@/types/ws/taskview";
import { cn } from "@/shadcn/lib/utils";
import BackLink from "@/components/shared/BackLink";
import TaskStruct from "./TaskStruct";
import MMStruct from "./MMStruct";
import Creds from "./Creds";
import Sched from "./Sched";

export type ViewProps = {
  viewData: WebsocketTaskviewData;
};

export default function View({ viewData }: ViewProps) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <BackLink />
      </div>
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1",
          "md:grid-cols-2",
          "lg:grid-cols-3",
        )}
      >
        <TaskStruct viewData={viewData} />
        <MMStruct memory={viewData.memory} />
        <div>
          <Creds credData={viewData.realCreds} />
          <div className="mt-4">
            <Sched schedData={viewData.sched} />
          </div>
        </div>
      </div>
    </div>
  );
}
