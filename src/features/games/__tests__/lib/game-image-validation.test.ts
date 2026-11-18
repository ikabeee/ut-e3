import { GAME_IMAGE_SLOTS, findGameImageSlot, buildGameImageFileName } from "@features/games/lib/game-image-slots";
import { GAME_IMAGE_MAX_BYTES, validateGameImage } from "@features/games/lib/game-image-validation";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { buildJpeg } from "@features/games/__tests__/lib/jpeg-fixture";

const ERRORS = GAMES_COPY.standGame.images.errors;

const card = slot("card");

const landscape = slot("landscape");

describe("the slots of the grid", () => {
  it("are the card, the landscape cover and four screenshots, in the order of the gallery", () => {
    expect(
      GAME_IMAGE_SLOTS.map(({ id, position, isCover, width, height }) => [id, position, isCover, width, height]),
    ).toEqual([
      ["card", 1, true, 810, 1080],
      ["landscape", 2, false, 1920, 1080],
      ["screenshot-1", 3, false, 1920, 1080],
      ["screenshot-2", 4, false, 1920, 1080],
      ["screenshot-3", 5, false, 1920, 1080],
      ["screenshot-4", 6, false, 1920, 1080],
    ]);
  });

  it("name the files as the grid does", () => {
    expect(GAME_IMAGE_SLOTS.map((entry) => buildGameImageFileName("ruta-9", entry, "abc"))).toEqual([
      "ruta-9-abc.jpg",
      "ruta-9-portada-abc.jpg",
      "ruta-9-captura-01-abc.jpg",
      "ruta-9-captura-02-abc.jpg",
      "ruta-9-captura-03-abc.jpg",
      "ruta-9-captura-04-abc.jpg",
    ]);
  });

  it("do not include a fifth screenshot or an unknown name", () => {
    expect(findGameImageSlot("screenshot-5")).toBeUndefined();
    expect(findGameImageSlot("screenshot-0")).toBeUndefined();
    expect(findGameImageSlot("../card")).toBeUndefined();
    expect(findGameImageSlot("")).toBeUndefined();
  });
});

describe("validateGameImage", () => {
  it("accepts a JPEG with the size of the slot", () => {
    expect(validateGameImage(card, buildJpeg({ width: 810, height: 1080 }))).toBeNull();
    expect(validateGameImage(landscape, buildJpeg({ width: 1920, height: 1080 }))).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(validateGameImage(card, new Uint8Array())).toBe(ERRORS.missing);
  });

  it("rejects a file that is not a JPEG even if it is named .jpg", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

    expect(validateGameImage(card, png)).toBe(ERRORS.notJpeg);
  });

  it("rejects a size that is not exact, saying both sizes", () => {
    expect(validateGameImage(card, buildJpeg({ width: 1920, height: 1080 }))).toBe(
      ERRORS.wrongSize({ width: 1920, height: 1080 }, { width: 810, height: 1080 }),
    );
    expect(validateGameImage(landscape, buildJpeg({ width: 1919, height: 1080 }))).toBe(
      ERRORS.wrongSize({ width: 1919, height: 1080 }, { width: 1920, height: 1080 }),
    );
    expect(validateGameImage(landscape, buildJpeg({ width: 810, height: 1080 }))).toBe(
      ERRORS.wrongSize({ width: 810, height: 1080 }, { width: 1920, height: 1080 }),
    );
  });

  it("rejects a JPEG that is not RGB or gray", () => {
    expect(validateGameImage(landscape, buildJpeg({ width: 1920, height: 1080, components: 4 }))).toBe(ERRORS.notRgb);
  });

  it("rejects a file over 5 MB before looking at it", () => {
    const heavy = buildJpeg({ width: 1920, height: 1080, paddingSegments: 81 });

    expect(heavy.byteLength).toBeGreaterThan(GAME_IMAGE_MAX_BYTES);
    expect(validateGameImage(landscape, heavy)).toBe(ERRORS.tooLarge);
  });
});

function slot(id: string) {
  const found = findGameImageSlot(id);

  if (!found) throw new Error(`Missing slot ${id}`);

  return found;
}
