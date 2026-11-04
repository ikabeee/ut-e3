import { buildStairCells, cellsToPath } from "@features/studio/lib/pixel-stairs";

describe("buildStairCells", () => {
  it("fills diagonal bands that rise to the right", () => {
    const cells = buildStairCells(10, 2);

    expect(cells).toContainEqual({ x: 0, y: 0 });
    expect(cells).toContainEqual({ x: 3, y: 0 });
    expect(cells).not.toContainEqual({ x: 4, y: 0 });
    expect(cells).toContainEqual({ x: 2, y: 1 });
    expect(cells).not.toContainEqual({ x: 3, y: 1 });
  });
});

describe("cellsToPath", () => {
  it("draws one unit square per cell", () => {
    expect(cellsToPath([{ x: 2, y: 3 }])).toBe("M2 3h1v1h-1z");
  });
});
