import type { WebsocketTaskviewData } from "@/types/ws/taskview";
import { Field, FieldGroupTitle } from "./Shared";
import { Separator } from "@/shadcn/components/ui/separator";

type TaskStructProps = {
  viewData: WebsocketTaskviewData;
};

export default function TaskStruct({ viewData }: TaskStructProps) {
  return (
    <div>
      <div className="px-4 py-2 bg-green-950">
        <span className="font-bold font-mono text-green-300">task_struct</span>
      </div>
      <div className="mt-2">
        <FieldGroupTitle title="Identity" />
        <Field name="pid" value={viewData.pid} />
        <Field name="tgid" value={viewData.tgid} />
        <Field name="start_time" value={viewData.startTime} />
        <Field name="comm" value={viewData.comm} />
        <Separator className="my-2" />
        <FieldGroupTitle title="Parent" />
        <Field name="pid" value={viewData.parent.pid} />
        <Field name="start_time" value={viewData.parent.startTime} />
        <Separator className="my-2" />
        <FieldGroupTitle title="Real Parent" />
        <Field name="pid" value={viewData.realParent.pid} />
        <Field name="start_time" value={viewData.realParent.startTime} />
        <Separator className="my-2" />
        <FieldGroupTitle title="State" />
        <Field name="state" value={viewData.state} />
        <Field name="exit_state" value={viewData.exitState} />
        <Field name="exit_code" value={viewData.exitCode} />
        <Field name="exit_signal" value={viewData.exitSignal} />
        <Separator className="my-2" />
        <FieldGroupTitle title="Security" />
        <Field name="stack_canary" value={viewData.stackCanary} />
      </div>
    </div>
  );
}
