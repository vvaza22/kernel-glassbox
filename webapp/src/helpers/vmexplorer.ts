export function isFlagSet(value: bigint, flagMask: bigint): boolean {
  return (value & flagMask) !== 0n;
}
