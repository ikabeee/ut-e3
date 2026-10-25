import { clampIndex, wrapIndex } from "@shared/lib/carousel-index";

describe("wrapIndex", () => {
  it("goes from the last item to the first and from the first to the last", () => {
    expect(wrapIndex(4, 4)).toBe(0);
    expect(wrapIndex(-1, 4)).toBe(3);
  });

  it("keeps an index that is already in range", () => {
    expect(wrapIndex(2, 4)).toBe(2);
  });
});

describe("clampIndex", () => {
  it("stops at the first and last item", () => {
    expect(clampIndex(-1, 18)).toBe(0);
    expect(clampIndex(18, 18)).toBe(17);
  });

  it("keeps an index that is already in range", () => {
    expect(clampIndex(8, 18)).toBe(8);
  });
});
