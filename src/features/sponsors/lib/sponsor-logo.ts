import { readJpegInfo } from "@features/games/lib/jpeg-info";

export type LogoExtension = "png" | "jpg" | "webp";

export interface LogoImageInfo {
  extension: LogoExtension;
  width: number;
  height: number;
}

/** The public path of the logos that the sysadmin uploads; the Route Handler of the media serves it. */
export const SPONSOR_MEDIA_PATH = "/api/media/sponsors";

/** The most a logo can weigh: a logo is a small picture, and the Server Actions accept bodies of up to 6 MB. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** The most pixels a side can have: bigger files are not logos, and the browser would decode them for nothing. */
export const LOGO_MAX_DIMENSION = 4000;

export const LOGO_CONTENT_TYPES: Record<LogoExtension, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

// The names the app writes: the slug of the sponsor, then 12 hex digits of the hash of the content. Nothing else is read.
const LOGO_FILE_NAME = /^sponsor-[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{12}\.(?:png|jpg|webp)$/;

const SLUG_MAX_LENGTH = 40;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// IHDR is always the first chunk: 4 bytes of length, its name, then the width and the height as 32-bit numbers.
const PNG_IHDR = [0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52];

// The empty IEND chunk (length, name, CRC) that closes every PNG.
const PNG_END = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];

const RIFF = [0x52, 0x49, 0x46, 0x46];

const WEBP = [0x57, 0x45, 0x42, 0x50];

const WEBP_LOSSY = [0x56, 0x50, 0x38, 0x20];

const WEBP_LOSSLESS = [0x56, 0x50, 0x38, 0x4c];

const WEBP_EXTENDED = [0x56, 0x50, 0x38, 0x58];

const WEBP_LOSSY_START_CODE = [0x9d, 0x01, 0x2a];

const WEBP_LOSSLESS_SIGNATURE = 0x2f;

/** The format and size of a valid logo, or null. */
export function readLogoImageInfo(bytes: Uint8Array): LogoImageInfo | null {
  const inspection = inspectLogoImage(bytes);

  return inspection.status === "valid" ? inspection.info : null;
}

export type LogoInspection = { status: "valid"; info: LogoImageInfo } | { status: "notImage" } | { status: "badSize" };

/**
 * The format and the size of a logo, read from its first bytes and never from its name or the type the browser sent.
 * Only PNG, JPEG and WebP are logos: an SVG can carry scripts, so it is refused like anything that is not an image (or
 * that was cut). A side of zero or over `LOGO_MAX_DIMENSION` is a `badSize`.
 */
export function inspectLogoImage(bytes: Uint8Array): LogoInspection {
  const info = readInfo(bytes);

  if (!info) return { status: "notImage" };

  return isSaneSize(info) ? { status: "valid", info } : { status: "badSize" };
}

export function buildSponsorLogoFileName(slug: string, version: string, extension: LogoExtension): string {
  return `sponsor-${slug}-${version}.${extension}`;
}

export function buildSponsorLogoUrl(fileName: string): string {
  return `${SPONSOR_MEDIA_PATH}/${fileName}`;
}

/** The file name of a logo path that the app stored, or null for any other path (such as the logos of public/). */
export function readSponsorLogoFileName(logoPath: string): string | null {
  const prefix = `${SPONSOR_MEDIA_PATH}/`;
  const fileName = logoPath.startsWith(prefix) ? logoPath.slice(prefix.length) : "";

  return isSponsorLogoFileName(fileName) ? fileName : null;
}

export function isSponsorLogoFileName(fileName: string): boolean {
  return LOGO_FILE_NAME.test(fileName);
}

/** The extension of a name that `isSponsorLogoFileName` accepts. */
export function readLogoExtension(fileName: string): LogoExtension {
  if (fileName.endsWith(".png")) return "png";

  return fileName.endsWith(".jpg") ? "jpg" : "webp";
}

/** The part of a file name that comes from the sponsor: lower case, without accents, with hyphens between words. */
export function buildSponsorSlug(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const slug = words.join("-").slice(0, SLUG_MAX_LENGTH).replace(/-$/, "");

  return slug || "logo";
}

function readInfo(bytes: Uint8Array): LogoImageInfo | null {
  if (startsWith(bytes, 0, PNG_SIGNATURE)) return readPng(bytes);

  if (startsWith(bytes, 0, RIFF)) return readWebp(bytes);

  const jpeg = readJpegInfo(bytes);

  return jpeg ? { extension: "jpg", width: jpeg.width, height: jpeg.height } : null;
}

function readPng(bytes: Uint8Array): LogoImageInfo | null {
  const isWhole = startsWith(bytes, PNG_SIGNATURE.length, PNG_IHDR) && endsWith(bytes, PNG_END);

  if (!isWhole || bytes.length < PNG_SIGNATURE.length + PNG_IHDR.length + 8) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return { extension: "png", width: view.getUint32(16), height: view.getUint32(20) };
}

// A RIFF container whose first chunk is lossy (VP8), lossless (VP8L) or extended (VP8X), all of which carry the size.
function readWebp(bytes: Uint8Array): LogoImageInfo | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const isContainer = bytes.length >= 30 && startsWith(bytes, 8, WEBP) && view.getUint32(4, true) + 8 <= bytes.length;

  if (!isContainer) return null;

  const size = readWebpSize(bytes, view);

  return size ? { extension: "webp", ...size } : null;
}

function readWebpSize(bytes: Uint8Array, view: DataView): { width: number; height: number } | null {
  if (startsWith(bytes, 12, WEBP_LOSSY) && startsWith(bytes, 23, WEBP_LOSSY_START_CODE)) {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }

  if (startsWith(bytes, 12, WEBP_LOSSLESS) && bytes[20] === WEBP_LOSSLESS_SIGNATURE) {
    const packed = view.getUint32(21, true);

    return { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1 };
  }

  if (startsWith(bytes, 12, WEBP_EXTENDED)) {
    return { width: readUint24(view, 24) + 1, height: readUint24(view, 27) + 1 };
  }

  return null;
}

function isSaneSize({ width, height }: LogoImageInfo): boolean {
  return width > 0 && height > 0 && width <= LOGO_MAX_DIMENSION && height <= LOGO_MAX_DIMENSION;
}

function readUint24(view: DataView, offset: number): number {
  return view.getUint16(offset, true) + view.getUint8(offset + 2) * 65_536;
}

function startsWith(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  return bytes.length >= offset + expected.length && expected.every((value, index) => bytes[offset + index] === value);
}

function endsWith(bytes: Uint8Array, expected: readonly number[]): boolean {
  return startsWith(bytes, bytes.length - expected.length, expected);
}
