/** The images of a game that the grid of covers asks for: the card, the landscape cover and up to four screenshots. */
export interface GameImageSlot {
  /** What the form posts to name the slot: `card`, `landscape` or `screenshot-1` to `screenshot-4`. */
  id: string;
  /** Position in `game_images`: the gallery order is the landscape cover, the card and then the screenshots. */
  position: number;
  isCover: boolean;
  width: number;
  height: number;
  /** What follows the slug in the name of the file the grid uses (`<slug>-portada.jpg`). */
  fileSuffix: string;
  isRequired: boolean;
}

const LANDSCAPE_SIZE = { width: 1920, height: 1080 };

export const MAX_SCREENSHOTS = 4;

export const GAME_IMAGE_SLOTS: readonly GameImageSlot[] = [
  { id: "card", position: 1, isCover: true, width: 810, height: 1080, fileSuffix: "", isRequired: true },
  { id: "landscape", position: 2, isCover: false, ...LANDSCAPE_SIZE, fileSuffix: "-portada", isRequired: false },
  ...Array.from({ length: MAX_SCREENSHOTS }, (_, index) => buildScreenshotSlot(index + 1)),
];

export function findGameImageSlot(id: string): GameImageSlot | undefined {
  return GAME_IMAGE_SLOTS.find((slot) => slot.id === id);
}

/** The screenshots are the only slots that can be removed: the card and the landscape cover are replaced. */
export function isScreenshotSlot(slot: GameImageSlot): boolean {
  return slot.id.startsWith("screenshot-");
}

/** The name of the file as the grid names it, with a short version of its content so a new image is a new URL. */
export function buildGameImageFileName(slug: string, slot: GameImageSlot, version: string): string {
  return `${slug}${slot.fileSuffix}-${version}.jpg`;
}

function buildScreenshotSlot(number: number): GameImageSlot {
  return {
    id: `screenshot-${number}`,
    position: 2 + number,
    isCover: false,
    ...LANDSCAPE_SIZE,
    fileSuffix: `-captura-${String(number).padStart(2, "0")}`,
    isRequired: number === 1,
  };
}
