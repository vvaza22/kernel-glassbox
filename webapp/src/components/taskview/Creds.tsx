import type { WebsocketCredData } from "@/types/ws/taskview";
import { Field } from "./Shared";

type CredsProps = {
  credData: WebsocketCredData;
};

export default function Creds({ credData }: CredsProps) {
  return (
    <div>
      <div className="px-4 py-2 bg-blue-950">
        <span className="font-bold font-mono text-blue-300">real_creds</span>
      </div>
      <div className="mt-2">
        <Field name="uid" value={credData.uid} />
        <Field name="gid" value={credData.gid} />
        <Field name="suid" value={credData.suid} />
        <Field name="sgid" value={credData.sgid} />
        <Field name="euid" value={credData.euid} />
        <Field name="egid" value={credData.egid} />
      </div>
    </div>
  );
}
