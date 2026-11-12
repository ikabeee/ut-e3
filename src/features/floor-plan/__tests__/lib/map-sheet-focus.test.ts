import { centerOn, focusLimits, type MapView, type ViewLimits } from "@features/floor-plan/lib/map-viewport";

const MAP = { width: 940, height: 600 };

const STAND = { x: 470, y: 300 };

function limitsFor(viewportWidth: number, viewportHeight: number): ViewLimits {
  return {
    minScale: 0.5,
    maxScale: 2.5,
    mapWidth: MAP.width,
    mapHeight: MAP.height,
    viewportWidth,
    viewportHeight,
  };
}

function screenYOf(view: MapView): number {
  return STAND.y * view.scale + view.y;
}

describe("sheet focus", () => {
  it("centers the focused stand in the area above the open sheet below 1000 px", () => {
    const viewport = { width: 390, height: 600 };

    const sheetHeight = 220;

    const view = centerOn(
      { scale: 1, x: 0, y: 0 },
      STAND,
      focusLimits(limitsFor(390, 600), viewport.width, sheetHeight),
    );

    expect(screenYOf(view)).toBeCloseTo((viewport.height - sheetHeight) / 2, 0);
  });

  it("keeps centering in the whole viewport from 1000 px even with the detail open", () => {
    const view = centerOn({ scale: 1, x: 0, y: 0 }, STAND, focusLimits(limitsFor(1200, 800), 1200, 220));

    expect(screenYOf(view)).toBeCloseTo(400, 0);
  });
});
