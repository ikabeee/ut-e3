import {
  COMPACT_SCALE,
  MAX_SCALE,
  centerOn,
  fitView,
  isCompact,
  panBy,
  zoomAt,
} from "@features/floor-plan/lib/map-viewport";

const MAP = { width: 940, height: 600 };

const VIEWPORT = { width: 940, height: 600 };

function limitsFor(viewport = VIEWPORT, minScale = 0.5, maxScale = MAX_SCALE) {
  return {
    minScale,
    maxScale,
    mapWidth: MAP.width,
    mapHeight: MAP.height,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  };
}

describe("fitView", () => {
  it("fits the whole map inside the viewport with a small margin", () => {
    const view = fitView(MAP, VIEWPORT);

    expect(view.scale).toBeLessThanOrEqual(1);
    expect(view.scale).toBeGreaterThan(0.9);
    expect(view.scale * MAP.width).toBeLessThanOrEqual(VIEWPORT.width);
    expect(view.scale * MAP.height).toBeLessThanOrEqual(VIEWPORT.height);
  });

  it("centers the fitted map in the viewport", () => {
    const view = fitView(MAP, VIEWPORT);

    expect(view.x).toBeCloseTo((VIEWPORT.width - MAP.width * view.scale) / 2);
    expect(view.y).toBeCloseTo((VIEWPORT.height - MAP.height * view.scale) / 2);
  });

  it("shrinks the map to fit a smaller viewport", () => {
    const view = fitView(MAP, { width: 470, height: 300 });

    expect(view.scale).toBeLessThanOrEqual(0.5);
    expect(view.scale).toBeGreaterThan(0.4);
    expect(view.scale * MAP.width).toBeLessThanOrEqual(470);
    expect(view.scale * MAP.height).toBeLessThanOrEqual(300);
  });
});

describe("zoomAt", () => {
  it("zooms keeping the map point under the cursor fixed", () => {
    const view = zoomAt({ scale: 1, x: 0, y: 0 }, { factor: 2, point: { x: 100, y: 50 } }, limitsFor());

    expect(view.scale).toBe(2);
    expect(view.x).toBeCloseTo(-100);
    expect(view.y).toBeCloseTo(-50);
  });

  it("keeps the cursor anchored when zooming an already moved map", () => {
    const view = zoomAt({ scale: 1.5, x: -40, y: 20 }, { factor: 1.5, point: { x: 200, y: 100 } }, limitsFor());

    expect(view.scale).toBeCloseTo(2.25);
    expect(view.x).toBeCloseTo(-160);
    expect(view.y).toBeCloseTo(-20);
  });

  it("clamps the scale to the maximum zoom", () => {
    const view = zoomAt({ scale: 1, x: 0, y: 0 }, { factor: 100, point: { x: 100, y: 50 } }, limitsFor());

    expect(view.scale).toBe(MAX_SCALE);
    expect(MAX_SCALE).toBe(2.5);
    expect(view.x).toBeCloseTo(100 - 100 * MAX_SCALE);
    expect(view.y).toBeCloseTo(50 - 50 * MAX_SCALE);
  });

  it("clamps the scale to the fit zoom", () => {
    const view = zoomAt(
      { scale: 1, x: 0, y: 0 },
      { factor: 0.001, point: { x: 100, y: 50 } },
      limitsFor(VIEWPORT, 0.4),
    );

    expect(view.scale).toBeCloseTo(0.4);
  });
});

describe("panBy", () => {
  it("moves the map by the given delta", () => {
    expect(panBy({ scale: 1, x: 0, y: 0 }, { x: 50, y: 30 }, limitsFor())).toEqual({ scale: 1, x: 50, y: 30 });
  });

  it("clamps a far pan so the map cannot leave the viewport entirely", () => {
    const view = panBy({ scale: 1, x: 0, y: 0 }, { x: -100000, y: -100000 }, limitsFor());

    expect(view.scale).toBe(1);
    expect(view.x + MAP.width * view.scale).toBeGreaterThan(0);
    expect(view.x).toBeLessThan(VIEWPORT.width);
    expect(view.y + MAP.height * view.scale).toBeGreaterThan(0);
    expect(view.y).toBeLessThan(VIEWPORT.height);
  });

  it("clamps a far pan in the other direction too", () => {
    const view = panBy({ scale: 1, x: 0, y: 0 }, { x: 100000, y: 100000 }, limitsFor());

    expect(view.x + MAP.width * view.scale).toBeGreaterThan(0);
    expect(view.x).toBeLessThan(VIEWPORT.width);
    expect(view.y + MAP.height * view.scale).toBeGreaterThan(0);
    expect(view.y).toBeLessThan(VIEWPORT.height);
  });
});

describe("centerOn", () => {
  it("centers a map point in the viewport without changing the scale", () => {
    const view = centerOn({ scale: 1, x: 0, y: 0 }, { x: 470, y: 300 }, limitsFor());

    expect(view).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("centers a corner of the map in a smaller viewport", () => {
    const view = centerOn({ scale: 1, x: 0, y: 0 }, { x: 470, y: 300 }, limitsFor({ width: 470, height: 300 }));

    expect(view.scale).toBe(1);
    expect(view.x).toBe(-235);
    expect(view.y).toBe(-150);
  });
});

describe("isCompact", () => {
  it("treats 0.75 as the threshold: compact only below it", () => {
    expect(COMPACT_SCALE).toBe(0.75);
    expect(isCompact(0.5)).toBe(true);
    expect(isCompact(0.74)).toBe(true);
    expect(isCompact(0.75)).toBe(false);
    expect(isCompact(1)).toBe(false);
  });
});
