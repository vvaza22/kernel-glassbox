import useVME from "@/hooks/vmexplorer";
import { cn } from "@/shadcn/lib/utils";
import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { debug } from "@/helpers/logger";
import { VME_UNSPEC_INDEX, type VMEPath } from "@/types/ws/vmexplorer";
import { Link } from "wouter";

function toPathObj(path: string | undefined): VMEPath {
  let result: VMEPath = {
    l4: VME_UNSPEC_INDEX,
    l3: VME_UNSPEC_INDEX,
    l2: VME_UNSPEC_INDEX,
    l1: VME_UNSPEC_INDEX,
  };
  if (!path) {
    return result;
  }
  const parts = path.split("/");
  if (parts.length >= 1) result.l4 = parseInt(parts[0], 10);
  if (parts.length >= 2) result.l3 = parseInt(parts[1], 10);
  if (parts.length >= 3) result.l2 = parseInt(parts[2], 10);
  if (parts.length === 4) result.l1 = parseInt(parts[3], 10);
  return result;
}

export function VMExplorer() {
  const params = useParams();
  const { explore, entries, connected } = useVME();
  const [location] = useLocation();

  useEffect(() => {
    debug("Params:", params);
    const pid = parseInt(params["pid"]!, 10);
    const startTime = parseInt(params["startTime"]!, 10);
    const pathObj = toPathObj(params["*"]);
    debug(`VME (${pid}, ${startTime})`);
    debug("Path:", pathObj);
    const key = {
      pid,
      startTime,
    };
    explore(key, pathObj);
  }, [params, connected]);

  return (
    <div className="w-full">
      <div className="p-4">
        <div className={cn("grid grid-cols-8")}>
          {entries
            .filter((entry) => entry.present)
            .map((entry) => (
              <div
                key={entry.index}
                className="border p-2 flex flex-col items-center text-sm"
              >
                <div>
                  <Link href={`${location}/${entry.index}`}>
                    Index: {entry.index}
                  </Link>
                </div>
                <div className="font-mono">{entry.rawValue}</div>
                <div>PA: {entry.pa}</div>
                <div>Kernel VA: {entry.kernelVA}</div>
                <div>User VA: {entry.userVA}</div>
                <div>{entry.leaf ? "Leaf" : "Non-leaf"}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
