import {
  formatAdminDateTime,
  getNextImageSortOrder,
  isGameVisible,
  summarizeAdmin,
  toAdminOptions,
  toCoverImageInput,
} from "@features/admin/lib/admin-records";
import type { GameImageRecord } from "@features/games/lib/types";

const image = (overrides: Partial<GameImageRecord> = {}): GameImageRecord => ({
  id: "image-1",
  imageUrl: "/mock/games/ruta-9.jpg",
  altText: "Ruta 9",
  cropPosition: null,
  isCover: false,
  sortOrder: 0,
  ...overrides,
});

describe("toAdminOptions", () => {
  it("uses the id as the value and the name as the label", () => {
    expect(toAdminOptions([{ id: "a", name: "Acción" }])).toEqual([{ value: "a", label: "Acción" }]);
  });
});

describe("isGameVisible", () => {
  it("is visible only when one of its images is the cover", () => {
    expect(isGameVisible({ images: [] })).toBe(false);
    expect(isGameVisible({ images: [image()] })).toBe(false);
    expect(isGameVisible({ images: [image(), image({ id: "image-2", isCover: true })] })).toBe(true);
  });
});

describe("summarizeAdmin", () => {
  it("counts teams with stand and games with cover", () => {
    const summary = summarizeAdmin(
      [{ standCode: "A1" }, { standCode: null }],
      [{ images: [image({ isCover: true })] }, { images: [] }, { images: [image()] }],
      4,
    );

    expect(summary).toEqual({ teams: 2, teamsWithStand: 1, games: 3, visibleGames: 1, winners: 4 });
  });
});

describe("toCoverImageInput", () => {
  it("keeps the image fields and marks it as the cover", () => {
    expect(toCoverImageInput(image({ cropPosition: "60% 35%", sortOrder: 2 }))).toEqual({
      imageUrl: "/mock/games/ruta-9.jpg",
      altText: "Ruta 9",
      cropPosition: "60% 35%",
      sortOrder: 2,
      isCover: true,
    });
  });
});

describe("getNextImageSortOrder", () => {
  it("suggests the position after the last image, up to 4", () => {
    expect(getNextImageSortOrder([])).toBe(0);
    expect(getNextImageSortOrder([{ sortOrder: 0 }, { sortOrder: 2 }])).toBe(3);
    expect(getNextImageSortOrder([{ sortOrder: 4 }])).toBe(4);
  });
});

describe("formatAdminDateTime", () => {
  it("shows the date and time in the event time zone", () => {
    expect(formatAdminDateTime("2026-11-27T22:05:00Z")).toBe("27/11, 17:05");
  });
});
