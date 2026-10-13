import { renderHook } from "@testing-library/react";
import { usePlanFlash } from "@features/floor-plan/hooks/use-plan-flash";

// Croquis mínimo: un stand con su rectángulo y el token de color definido en el contenedor.
function buildPlan() {
  const container = document.createElement("div");
  container.style.setProperty("--utg-white", "#fafafa");
  container.innerHTML = `<svg><g data-plan-item="A1"><rect data-plan-fill></rect></g></svg>`;
  document.body.append(container);
  const shape = container.querySelector("rect") as SVGRectElement;
  const animate = jest.fn();
  shape.animate = animate;

  return { container, animate };
}

describe("usePlanFlash", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("flashes the item with the theme color instead of a fixed one", () => {
    const { container, animate } = buildPlan();
    const { result } = renderHook(() => usePlanFlash({ current: container }));

    result.current("A1");

    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes] = animate.mock.calls[0] as [Keyframe[]];
    expect(keyframes).toContainEqual(expect.objectContaining({ fill: "#fafafa" }));
  });

  it("does nothing for an item that is not on the plan", () => {
    const { container, animate } = buildPlan();
    const { result } = renderHook(() => usePlanFlash({ current: container }));

    result.current("Z9");

    expect(animate).not.toHaveBeenCalled();
  });
});
