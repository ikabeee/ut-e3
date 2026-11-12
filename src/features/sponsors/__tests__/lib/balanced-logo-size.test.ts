import { getBalancedLogoSize } from "@features/sponsors/lib/balanced-logo-size";

const WIDE_BOX = { area: 5200, maxWidth: 104, maxHeight: 84 };

const COMPACT_BOX = { area: 3400, maxWidth: 80, maxHeight: 64 };

describe("getBalancedLogoSize", () => {
  it("gives a square logo the whole area", () => {
    expect(getBalancedLogoSize(1, WIDE_BOX)).toEqual({ width: 72, height: 72 });
  });

  it("gives a landscape logo the same area with its own ratio", () => {
    expect(getBalancedLogoSize(1.6, WIDE_BOX)).toEqual({ width: 91, height: 57 });
  });

  it("clamps a wide wordmark to the max width and keeps its ratio", () => {
    expect(getBalancedLogoSize(4, WIDE_BOX)).toEqual({ width: 104, height: 26 });
  });

  it("clamps a tall logo to the max height and keeps its ratio", () => {
    expect(getBalancedLogoSize(0.5, WIDE_BOX)).toEqual({ width: 42, height: 84 });
  });

  it("uses the smaller box on phones", () => {
    expect(getBalancedLogoSize(1, COMPACT_BOX)).toEqual({ width: 58, height: 58 });
    expect(getBalancedLogoSize(4, COMPACT_BOX)).toEqual({ width: 80, height: 20 });
  });
});
