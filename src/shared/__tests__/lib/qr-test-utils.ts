import { encode } from "uqr";

const QUIET_ZONE_MODULES = 4;

/** Reads the dark modules back from the path that buildQrCode draws, as the matrix of the code with its quiet zone. */
export function readMatrixFromPath(path: string, size: number): boolean[][] {
  const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  for (const run of path.matchAll(/M(\d+),(\d+)h(\d+)v1h-\d+z/g)) {
    const [x, y, length] = [Number(run[1]), Number(run[2]), Number(run[3])];

    for (let offset = 0; offset < length; offset += 1) matrix[y][x + offset] = true;
  }

  return matrix;
}

/** What an independent encoder (the library itself, with the same settings) gives for the text, with the quiet zone. */
export function encodeWithQuietZone(text: string): boolean[][] {
  const { data, size } = encode(text, { ecc: "M", border: 0 });
  const total = size + QUIET_ZONE_MODULES * 2;

  return Array.from({ length: total }, (_, y) =>
    Array.from({ length: total }, (_, x) => data[y - QUIET_ZONE_MODULES]?.[x - QUIET_ZONE_MODULES] === true),
  );
}
