export function bigIntComparator(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
