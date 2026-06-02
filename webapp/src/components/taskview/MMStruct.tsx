import type { WebsocketMemoryData } from "@/types/ws/taskview";
import { Field } from "./Shared";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shadcn/lib/utils";
import { useTranslation } from "react-i18next";

type MMStructProps = {
  pid: string;
  startTime: string;
  memory: WebsocketMemoryData;
};

export default function MMStruct({ memory, pid, startTime }: MMStructProps) {
  const { t } = useTranslation("taskview");

  return (
    <div>
      <div className="px-4 py-2 bg-red-950">
        <div className="flex justify-between items-center">
          <span className="font-bold font-mono text-red-300">mm_struct</span>
          <Link
            href={`/vm/${pid}/${startTime}`}
            className={cn(
              "flex items-center gap-1",
              "transition-colors",
              "hover:bg-red-900",
              "rounded-xl",
              "px-2 py-1",
            )}
          >
            <span className="font-mono text-sm">{t("explorePageTables")}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
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
