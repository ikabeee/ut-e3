import type { GameImageSlot } from "@features/games/lib/game-image-slots";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { readJpegInfo } from "@features/games/lib/jpeg-info";

/** The most a file can weigh: a 1920x1080 JPEG of a game is well under this, and the volume of the event is small. */
export const GAME_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ERRORS = GAMES_COPY.standGame.images.errors;

// Components of a JPEG that a browser shows right: grayscale and RGB (YCbCr). CMYK is not sRGB.
const RGB_COMPONENTS = new Set([1, 3]);

/** The first rule that the file breaks for its slot, in Spanish, or null when it can be stored. */
export function validateGameImage(slot: GameImageSlot, bytes: Uint8Array): string | null {
  if (bytes.byteLength === 0) return ERRORS.missing;

  if (bytes.byteLength > GAME_IMAGE_MAX_BYTES) return ERRORS.tooLarge;

  const info = readJpegInfo(bytes);

  if (!info) return ERRORS.notJpeg;

  if (!RGB_COMPONENTS.has(info.components)) return ERRORS.notRgb;

  if (info.width !== slot.width || info.height !== slot.height) {
    return ERRORS.wrongSize(info, slot);
  }

  return null;
}
