import type { VMEntry } from "@/types/ui/vmexplorer";
import {
  VME_UNSPEC_INDEX,
  type VMEPath,
  type WebsocketVMEntry,
} from "@/types/ws/vmexplorer";
import { filesize } from "filesize";

export function toVMEntry(entry: WebsocketVMEntry): VMEntry {
  const sizeBigInt = BigInt(entry.size);
  return {
    index: entry.index,
    rawValue: BigInt(entry.rawValue),
    rawValueHex: entry.rawValue,
    pa: entry.pa,
    kernelVA: entry.kernelVA,
    userVAStart: entry.userVAStart,
    userVAEnd: entry.userVAEnd,
    size: sizeBigInt,
    sizeFormatted: filesize(sizeBigInt, { base: 2 }),
    leaf: entry.leaf,
    present: entry.present,
  };
}

export function toIndices(pathObj: VMEPath): number[] {
  return [pathObj.l4, pathObj.l3, pathObj.l2, pathObj.l1].filter(
    (idx) => idx !== VME_UNSPEC_INDEX,
  );
}

export function toPathObj(path: string | undefined): VMEPath {
  let result: VMEPath = {
    l4: VME_UNSPEC_INDEX,
    l3: VME_UNSPEC_INDEX,
    l2: VME_UNSPEC_INDEX,
    l1: VME_UNSPEC_INDEX,
  };
  if (!path) return result;
  const parts = path.split("/");
  if (parts.length >= 1) result.l4 = parseInt(parts[0], 10);
  if (parts.length >= 2) result.l3 = parseInt(parts[1], 10);
  if (parts.length >= 3) result.l2 = parseInt(parts[2], 10);
  if (parts.length === 4) result.l1 = parseInt(parts[3], 10);
  return result;
}
