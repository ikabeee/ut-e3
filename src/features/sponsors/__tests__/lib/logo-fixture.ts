export { buildJpeg } from "@features/games/__tests__/lib/jpeg-fixture";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const PNG_END = [0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];

type PngOptions = { width: number; height: number; hasEnd?: boolean; paddingBytes?: number };

/** The bytes of a minimal PNG: the signature, an IHDR with the size, optional filler, and the IEND chunk. */
export function buildPng({ width, height, hasEnd = true, paddingBytes = 0 }: PngOptions) {
  const header = [0, 0, 0, 13, ...ascii("IHDR"), ...uint32(width), ...uint32(height), 8, 6, 0, 0, 0, 0, 0, 0, 0];
  const bytes = new Uint8Array(PNG_SIGNATURE.length + header.length + paddingBytes + (hasEnd ? PNG_END.length : 0));

  bytes.set(PNG_SIGNATURE);
  bytes.set(header, PNG_SIGNATURE.length);

  if (hasEnd) bytes.set(PNG_END, bytes.length - PNG_END.length);

  return bytes;
}

type WebpOptions = { width: number; height: number; kind?: "lossy" | "lossless" | "extended" };

/** The bytes of a minimal WebP: a RIFF container with the first chunk of the chosen kind and the size in it. */
export function buildWebp({ width, height, kind = "lossy" }: WebpOptions) {
  const chunk = buildWebpChunk({ width, height, kind });
  const body = [...ascii("WEBP"), ...chunk];

  return Uint8Array.from([...ascii("RIFF"), ...uint32Little(body.length), ...body]);
}

/** Garbage that claims nothing: no image starts like this. */
export function buildGarbage(length = 64) {
  return Uint8Array.from({ length }, (_, index) => (index * 37 + 11) % 256);
}

/** The text of an SVG, which is what the sponsors must not be able to upload (it can carry scripts). */
export function buildSvg() {
  return new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
}

/** The same image padded with zeros to a size, so a file can be made heavy without changing what it is. */
export function padTo(bytes: Uint8Array, length: number) {
  const padded = new Uint8Array(length);

  padded.set(bytes);

  return padded;
}

function buildWebpChunk({ width, height, kind }: Required<WebpOptions>): number[] {
  if (kind === "lossless") {
    const packed = (width - 1) | ((height - 1) << 14);

    return [...ascii("VP8L"), ...uint32Little(10), 0x2f, ...uint32Little(packed), 0, 0, 0, 0, 0];
  }

  if (kind === "extended") {
    return [...ascii("VP8X"), ...uint32Little(10), 0, 0, 0, 0, ...uint24Little(width - 1), ...uint24Little(height - 1)];
  }

  return [
    ...ascii("VP8 "),
    ...uint32Little(10),
    0,
    0,
    0,
    0x9d,
    0x01,
    0x2a,
    ...uint16Little(width),
    ...uint16Little(height),
  ];
}

function ascii(text: string): number[] {
  return [...text].map((character) => character.codePointAt(0) ?? 0);
}

function uint32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function uint32Little(value: number): number[] {
  return uint32(value).toReversed();
}

function uint24Little(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff];
}

function uint16Little(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff];
}
