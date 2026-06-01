import type { WebsocketMemoryData } from "@/types/ws/taskview";
import { Field } from "./Shared";

type MMStructProps = {
  memory: WebsocketMemoryData;
};

export default function MMStruct({ memory }: MMStructProps) {
  return (
    <div>
      <div className="px-4 py-2 bg-red-950">
        <span className="font-bold font-mono text-red-300">mm_struct</span>
      </div>
      <div className="mt-2">
        <Field name="mmap_base" value={memory.mmapBase} />
        <Field name="task_size" value={memory.taskSize} />
        <Field name="total_vm" value={memory.totalVm} />
        <Field name="locked_vm" value={memory.lockedVm} />
        <Field name="data_vm" value={memory.dataVm} />
        <Field name="exec_vm" value={memory.execVm} />
        <Field name="stack_vm" value={memory.stackVm} />
        <Field name="start_code" value={memory.startCode} />
        <Field name="end_code" value={memory.endCode} />
        <Field name="start_data" value={memory.startData} />
        <Field name="end_data" value={memory.endData} />
        <Field name="start_brk" value={memory.startBrk} />
        <Field name="brk" value={memory.brk} />
        <Field name="start_stack" value={memory.startStack} />
        <Field name="arg_start" value={memory.argStart} />
        <Field name="arg_end" value={memory.argEnd} />
        <Field name="env_start" value={memory.envStart} />
        <Field name="env_end" value={memory.envEnd} />
      </div>
    </div>
  );
}
