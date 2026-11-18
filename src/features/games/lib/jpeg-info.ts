export interface JpegInfo {
  width: number;
  height: number;
  components: number;
}

const START_OF_IMAGE = [0xff, 0xd8];

const END_OF_IMAGE = [0xff, 0xd9];

// Markers that carry no length: restart markers (D0-D7), TEM (01) and SOI (D8).
const STANDALONE_MARKERS = new Set([0x01, 0xd8, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7]);

// Frame headers (SOF0-SOF15) except DHT (C4), JPG (C8) and DAC (CC), which share the range but are not frames.
const NOT_FRAME_MARKERS = new Set([0xc4, 0xc8, 0xcc]);

/**
 * Reads the size from the frame header of a JPEG without decoding it, so no image library is needed. It answers null
 * unless the bytes start with the SOI marker, hold a frame header with a size and finish with the EOI marker: a PNG or
 * a WebP with a .jpg name, or a file that was cut, is not a JPEG.
 */
export function readJpegInfo(bytes: Uint8Array): JpegInfo | null {
  if (!startsWith(bytes, START_OF_IMAGE) || !endsWithEndOfImage(bytes)) return null;

  let offset = START_OF_IMAGE.length;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;

    const marker = bytes[offset + 1];

    if (marker === 0xff) {
      offset += 1;
      continue;
    }

    if (STANDALONE_MARKERS.has(marker)) {
      offset += 2;
      continue;
    }

    if (isFrameMarker(marker)) return readFrame(bytes, offset + 4);

    offset += 2 + readUint16(bytes, offset + 2);
  }

  return null;
}

function readFrame(bytes: Uint8Array, start: number): JpegInfo | null {
  if (start + 6 > bytes.length) return null;

  const height = readUint16(bytes, start + 1);
  const width = readUint16(bytes, start + 3);

  return width > 0 && height > 0 ? { width, height, components: bytes[start + 5] } : null;
}

function isFrameMarker(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && !NOT_FRAME_MARKERS.has(marker);
}

function endsWithEndOfImage(bytes: Uint8Array): boolean {
  let end = bytes.length;

  while (end > 0 && bytes[end - 1] === 0) end -= 1;

  return end >= END_OF_IMAGE.length && startsWith(bytes.subarray(end - END_OF_IMAGE.length), END_OF_IMAGE);
}

function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] * 256 + bytes[offset + 1];
}
