/*
Note: This values are directly taken from the Linux kernel source code:
https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable_types.h#L10
*/
export const VME_BIT_PRESENT = 0n;
export const VME_BIT_RW = 1n;
export const VME_BIT_USER = 2n;
export const VME_BIT_PWT = 3n;
export const VME_BIT_PCD = 4n;
export const VME_BIT_ACCESSED = 5n;
export const VME_BIT_DIRTY = 6n;
export const VME_BIT_PSE = 7n;
export const VME_BIT_GLOBAL = 8n;
export const VME_BIT_NX = 63n;

export type VMEntry = {
  index: number;
  rawValue: bigint;
  rawValueHex: string;
  pa: string;
  kernelVA: string;
  userVAStart: string;
  userVAEnd: string;
  size: bigint;
  sizeFormatted: string;
  leaf: boolean;
  present: boolean;
  bad: boolean;
  none: boolean;
};
