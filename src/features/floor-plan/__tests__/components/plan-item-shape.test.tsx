import { fireEvent, render, screen } from "@testing-library/react";
import { PlanItemShape } from "@features/floor-plan/components/plan-item-shape";
import type { PlanRect } from "@features/floor-plan/lib/types";

const RECT: PlanRect = [30, 826, 130, 46];

const TOUCH_RECT: PlanRect = [20, 822, 150, 58];

function renderShape(props: { touchRect?: PlanRect; isHidden?: boolean; onSelect?: () => void } = {}) {
  const { container } = render(
    <svg>
      <PlanItemShape
        id="info"
        label="Información"
        rect={RECT}
        fill="var(--muted)"
        fillOpacity={0.22}
        stroke="var(--muted)"
        isSelected={false}
        onSelect={props.onSelect ?? jest.fn()}
        touchRect={props.touchRect}
        isHidden={props.isHidden}
      >
        <text>Info</text>
      </PlanItemShape>
    </svg>,
  );

  return container.querySelectorAll("rect");
}

describe("PlanItemShape", () => {
  it("draws only the visible rectangle without a touch area", () => {
    expect(renderShape()).toHaveLength(1);
  });

  it("adds an invisible touch area that selects the item and only reacts to touch", () => {
    const onSelect = jest.fn();
    const [touchArea, visible] = renderShape({ touchRect: TOUCH_RECT, onSelect });

    // Fuera del botón: el anillo de foco sigue el dibujo y el lector de pantalla no la anuncia.
    expect(screen.getByRole("button", { name: "Información" })).not.toContainElement(touchArea);
    expect(touchArea).toHaveAttribute("aria-hidden", "true");
    expect(touchArea).toHaveAttribute("fill", "transparent");
    expect(touchArea).toHaveAttribute("height", "58");
    expect(touchArea).toHaveClass("hidden", "pointer-coarse:block");
    expect(visible).toHaveAttribute("data-plan-fill");

    fireEvent.click(touchArea);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("drops the touch area while the filters hide the item", () => {
    expect(renderShape({ touchRect: TOUCH_RECT, isHidden: true })).toHaveLength(1);
  });
});
