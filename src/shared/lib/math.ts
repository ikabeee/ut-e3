/** Índice circular: después del último vuelve al primero y antes del primero, al último. */
export function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}
