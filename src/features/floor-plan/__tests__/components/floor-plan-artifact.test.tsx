import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STAND_FIXTURES } from "@features/floor-plan/__tests__/floor-plan-fixtures";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";

beforeEach(() => {
  stubMapSize(1200, 800);
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("FloorPlan artifact match", () => {
  it("labels the exterior area", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(screen.getByText("EXTERIOR")).toBeInTheDocument();
  });

  it("draws the dashed zone areas of the mockup", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(document.querySelectorAll("[data-zone-area]").length).toBeGreaterThanOrEqual(5);
  });

  it("renders the selected stand as a pin", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    const marker = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    expect(marker).toHaveAttribute("aria-pressed", "true");
    expect(marker.querySelector('[data-selected="true"]')).not.toBeNull();
  });

  it("shows the second line of the help centers and the marketplace", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(screen.getAllByText("Módulo de ayuda").length).toBeGreaterThan(0);
    expect(screen.getByText("Frente al Monumento a la Paz")).toBeInTheDocument();
  });
});

function stubMapSize(width: number, height: number): void {
  class SizedResizeObserver implements ResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element): void {
      const entry: ResizeObserverEntry = {
        target,
        contentRect: new DOMRectReadOnly(0, 0, width, height),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };

      this.callback([entry], this);
    }

    unobserve(): void {}

    disconnect(): void {}
  }

  window.ResizeObserver = SizedResizeObserver;
}
