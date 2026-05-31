/*
Note: This values are directly taken from the Linux kernel source code:
https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable_types.h#L10
*/
export const VME_MASK_PRESENT = 1n << 0n;
export const VME_MASK_RW = 1n << 1n;
export const VME_MASK_USER = 1n << 2n;
export const VME_MASK_PWT = 1n << 3n;
export const VME_MASK_PCD = 1n << 4n;
export const VME_MASK_ACCESSED = 1n << 5n;
export const VME_MASK_DIRTY = 1n << 6n;
export const VME_MASK_PSE = 1n << 7n;
export const VME_MASK_GLOBAL = 1n << 8n;
export const VME_MASK_NX = 1n << 63n;

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
};
