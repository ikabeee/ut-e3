import { encode } from "uqr";

/** A QR code ready to draw: a square of `size` modules (quiet zone included) and the path of its dark modules. */
export interface QrCode {
  size: number;
  path: string;
}

// Error correction M recovers about 15 % of the code, enough for a screen; 4 modules of quiet zone is what the
// standard asks for so a phone can find the code.
const ERROR_CORRECTION = "M";

const QUIET_ZONE_MODULES = 4;

/**
 * Encodes `text` as a QR code on this device: nothing leaves it, which matters for a link that is a secret. The path
 * draws each run of dark modules in a row as one rectangle (`M x,y h<n> v1 h-<n> z`).
 */
export function buildQrCode(text: string): QrCode {
  const { data, size } = encode(text, { ecc: ERROR_CORRECTION, border: 0 });
  const path = data.flatMap((row, y) => findDarkRuns(row).map((run) => drawRun({ ...run, y }))).join("");

  return { size: size + QUIET_ZONE_MODULES * 2, path };
}

interface Run {
  x: number;
  length: number;
}

function findDarkRuns(row: readonly boolean[]): Run[] {
  const runs: Run[] = [];
  let start = -1;

  row.forEach((isDark, x) => {
    if (isDark && start < 0) start = x;

    if (!isDark && start >= 0) {
      runs.push({ x: start, length: x - start });
      start = -1;
    }
  });

  if (start >= 0) runs.push({ x: start, length: row.length - start });

  return runs;
}

function drawRun({ x, y, length }: Run & { y: number }): string {
  return `M${x + QUIET_ZONE_MODULES},${y + QUIET_ZONE_MODULES}h${length}v1h-${length}z`;
}
