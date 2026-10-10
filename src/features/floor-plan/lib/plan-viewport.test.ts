import {
  clampViewBox,
  easeOutCubic,
  focusViewBox,
  getZoomPercent,
  interpolateViewBox,
  panViewBox,
  zoomViewBox,
} from "@features/floor-plan/lib/plan-viewport";

const base = { x: 0, y: 0, width: 1000, height: 600 };

describe("plan viewport", () => {
  it("returns to the full plan when zooming out past it", () => {
    expect(clampViewBox({ x: 300, y: 200, width: 1500, height: 900 }, base)).toEqual(base);
  });

  it("limits the zoom to six times the plan", () => {
    const view = zoomViewBox(base, 20, { x: 500, y: 300 }, base);

    expect(view.width).toBeCloseTo(1000 / 6);
    expect(getZoomPercent(view, base)).toBe(600);
  });

  it("keeps the zoom point fixed", () => {
    const view = zoomViewBox(base, 2, { x: 250, y: 150 }, base);

    expect(view).toEqual({ x: 125, y: 75, width: 500, height: 300 });
  });

  it("does not let the plan leave the view while panning", () => {
    const zoomed = { x: 0, y: 0, width: 500, height: 300 };

    expect(panViewBox(zoomed, -1000, 0, base).x).toBe(-125);
    expect(panViewBox(zoomed, 5000, 0, base).x).toBe(625);
  });

  it("frames a stand with room around it", () => {
    const view = focusViewBox([380, 250, 116, 80], base);

    expect(view.width).toBeCloseTo(522);
    expect(view.x + view.width / 2).toBeCloseTo(438);
    expect(view.y + view.height / 2).toBeCloseTo(290);
  });

  it("keeps a framed stand near the edge inside the limits", () => {
    expect(focusViewBox([40, 200, 76, 80], base).x).toBe(-125);
  });

  it("animates with an ease-out curve", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(interpolateViewBox(base, { x: 100, y: 100, width: 500, height: 300 }, 0.5)).toEqual({
      x: 50,
      y: 50,
      width: 750,
      height: 450,
    });
  });
});
