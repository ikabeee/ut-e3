interface JpegOptions {
  width: number;
  height: number;
  /** 3 is RGB, 1 is grayscale and 4 is CMYK. */
  components?: number;
  /** Extra comment segments of about 64 KB each, to make a file heavy. */
  paddingSegments?: number;
  hasEnd?: boolean;
}

const COMMENT_PAYLOAD = 65_000;

/** The bytes of a minimal JPEG: SOI, comments, a baseline frame header with the size, and the end marker. */
export function buildJpeg({ width, height, components = 3, paddingSegments = 0, hasEnd = true }: JpegOptions) {
  const comments = Array.from({ length: paddingSegments }, () => [
    0xff,
    0xfe,
    ...twoBytes(COMMENT_PAYLOAD + 2),
    ...Array.from({ length: COMMENT_PAYLOAD }, () => 0x20),
  ]);

  const componentSpecs = Array.from({ length: components }, (_, index) => [index + 1, 0x11, 0]);

  const frame = [0xff, 0xc0, ...twoBytes(8 + 3 * components), 8, ...twoBytes(height), ...twoBytes(width), components];

  return Uint8Array.from([
    0xff,
    0xd8,
    ...comments.flat(),
    ...frame,
    ...componentSpecs.flat(),
    ...(hasEnd ? [0xff, 0xd9] : []),
  ]);
}

function twoBytes(value: number): number[] {
  return [Math.floor(value / 256), value % 256];
}
