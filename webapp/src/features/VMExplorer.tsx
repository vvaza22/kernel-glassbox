import useVME from "@/hooks/vmexplorer";
import { useEffect } from "react";
import { useParams } from "wouter";
import { debug } from "@/helpers/logger";
import Header from "@/components/vmexplorer/Header";
import Nav from "@/components/vmexplorer/Nav";
import { NoEntries } from "@/components/vmexplorer/NoEntries";
import Entries from "@/components/vmexplorer/Entries";
import { toIndices, toPathObj, toVMEntry } from "@/adapters/vmexplorer";

export function VMExplorer() {
  const params = useParams();
  const { explore, entries, connected } = useVME();
  const mappedEntries = entries.filter((e) => !e.none).map(toVMEntry);

  // I can safely assume pid/startTime are present, otherwise this page would not be opened
  const pid = params["pid"]!;
  const startTime = params["startTime"]!;
  const pathObj = toPathObj(params["*"]);
  const pathIndices = toIndices(pathObj);

  useEffect(() => {
    debug("Params:", params);
    debug(`VME (${pid}, ${startTime})`);
    debug("Path:", pathObj);
    explore({ pid: pid, startTime: startTime }, pathObj);
  }, [params, connected]);

  const indicesToLink = (indices?: number[]) => {
    const base = `/vm/${pid}/${startTime}`;
    if (!indices || indices.length === 0) return base;
    return `${base}/${indices.join("/")}`;
  };

  return (
    <div className="p-6">
      <Header pid={pid} startTime={startTime} />
      <Nav
        pathIndices={pathIndices}
        numEntries={mappedEntries.length}
        toLink={indicesToLink}
      />
      {mappedEntries.length === 0 ? (
        <NoEntries />
      ) : (
        <Entries
          entries={mappedEntries}
          pathIndices={pathIndices}
          toLink={indicesToLink}
        />
      )}
    </div>
  );
}
