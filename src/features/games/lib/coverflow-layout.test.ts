import {
  describeCoverflowPosition,
  getCoverflowPlacement,
  getInitialCoverflowIndex,
} from "@features/games/lib/coverflow-layout";

describe("coverflow layout", () => {
  it("starts in the middle of the catalog", () => {
    expect(getInitialCoverflowIndex(18)).toBe(8);
    expect(getInitialCoverflowIndex(1)).toBe(0);
  });

  it("puts the current case in front", () => {
    const placement = getCoverflowPlacement(8, 8);

    expect(placement.isCurrent).toBe(true);
    expect(placement.style).toEqual({ transform: "translate3d(0px, 0, 0px) rotateY(0deg)", zIndex: 100 });
  });

  it("pushes the other cases to each side, turned towards the center", () => {
    const left = getCoverflowPlacement(6, 8);
    const right = getCoverflowPlacement(9, 8);

    expect(left.style.zIndex).toBe(98);
    expect(left.style.transform).toContain("calc(-1 * (var(--cw) * var(--gap-f) + 1 * var(--cw) * var(--step-f)))");
    expect(left.style.transform).toContain("rotateY(calc(var(--angle) * 1))");
    expect(right.style.transform).toContain("calc(1 * (var(--cw) * var(--gap-f) + 0 * var(--cw) * var(--step-f)))");
    expect(right.style.transform).toContain("rotateY(calc(var(--angle) * -1))");
  });

  it("describes the position for screen readers", () => {
    expect(describeCoverflowPosition(8, 18)).toBe("09 de 18");
  });
});
