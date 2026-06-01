export function isFlagSet(value: bigint, bit: bigint): boolean {
  const flagMask = 1n << bit;
  return (value & flagMask) !== 0n;
}
