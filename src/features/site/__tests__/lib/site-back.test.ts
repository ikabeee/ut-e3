import { getBackFallbackPath, isBackShown } from "@features/site/lib/site-back";

// RED (round 1, S1): `site-back.ts` does not exist yet on purpose. This whole
// suite fails with "Cannot find module" until round 2 implements the pure
// back-navigation rules. The import path is the one the handoff mandates.

describe("isBackShown", () => {
  it("hides the back control on the landing", () => {
    expect(isBackShown("/")).toBe(false);
  });

  it.each(["/games", "/raffle", "/games/abby-s-tower"])("shows the back control on the public page %s", (pathname) => {
    expect(isBackShown(pathname)).toBe(true);
  });

  it.each(["/", "/games"])("hides the back control on %s while only the landing is published", (pathname) => {
    expect(isBackShown(pathname, true)).toBe(false);
  });
});

describe("getBackFallbackPath", () => {
  it("falls back to the catalog from a game page", () => {
    expect(getBackFallbackPath("/games/abby-s-tower")).toBe("/games");
  });

  it("falls back to the landing from the catalog", () => {
    expect(getBackFallbackPath("/games")).toBe("/");
  });

  it("falls back to the landing from any other page", () => {
    expect(getBackFallbackPath("/raffle")).toBe("/");
  });

  it("falls back to the landing from the landing itself", () => {
    expect(getBackFallbackPath("/")).toBe("/");
  });
});
