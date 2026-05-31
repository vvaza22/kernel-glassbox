export type VMEntry = {
  index: number;
  rawValue: bigint;
  rawValueHex: string;
  pa: string;
  kernelVA: string;
  userVA: string;
  leaf: boolean;
  present: boolean;
};
