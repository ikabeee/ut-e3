export function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

export function clampIndex(index: number, length: number): number {
  return Math.min(length - 1, Math.max(0, index));
}
