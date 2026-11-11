import { getCoverflowPlacement, getInitialCoverflowIndex } from "@features/games/lib/coverflow-layout";

describe("getInitialCoverflowIndex", () => {
  it("starts on the middle game", () => {
    expect(getInitialCoverflowIndex(18)).toBe(8);
    expect(getInitialCoverflowIndex(5)).toBe(2);
  });
});

describe("getCoverflowPlacement", () => {
  it("puts the current case in front without turning it", () => {
    const placement = getCoverflowPlacement(8, 8);

    expect(placement.isCurrent).toBe(true);
    expect(placement.style.transform).toBe("translate3d(0px, 0, 0px) rotateY(0deg)");
    expect(placement.style.zIndex).toBe(100);
  });

  it("turns the side cases toward the center and stacks the farther ones below", () => {
    const left = getCoverflowPlacement(7, 8);
    const farRight = getCoverflowPlacement(10, 8);

    expect(left.isCurrent).toBe(false);
    expect(left.style.transform).toContain("rotateY(calc(var(--angle) * 1))");
    expect(farRight.style.transform).toContain("rotateY(calc(var(--angle) * -1))");
    expect(left.style.zIndex).toBe(99);
    expect(farRight.style.zIndex).toBe(98);
  });
});
