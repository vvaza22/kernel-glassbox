import type { WebsocketSchedData } from "@/types/ws/taskview";
import { Field } from "./Shared";

type SchedProps = {
  schedData: WebsocketSchedData;
};

export default function Sched({ schedData }: SchedProps) {
  return (
    <div>
      <div className="px-4 py-2 bg-purple-950">
        <span className="font-bold font-mono text-purple-300">
          sched_entity
        </span>
      </div>
      <div className="mt-2">
        <Field name="prio" value={schedData.prio} />
        <Field name="static_prio" value={schedData.staticPrio} />
        <Field name="normal_prio" value={schedData.normalPrio} />
        <Field name="vruntime" value={schedData.vruntime} />
        <Field name="sum_exec_runtime" value={schedData.sumExecRuntime} />
      </div>
    </div>
  );
}
