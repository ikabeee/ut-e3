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

describe("FloorPlan compact selection", () => {
  it("zooms to scale 1 and opens the detail when selecting a stand while compact", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);
    await zoomOutUntilCompact(user);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    expect(mapScale()).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Detalle del croquis")).toBeInTheDocument();
  });

  it("zooms to scale 1 when selecting from the list while compact", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);
    await zoomOutUntilCompact(user);
    await user.click(screen.getByRole("button", { name: "Ver como lista" }));

    const listButtons = screen.getAllByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    expect(listButtons).toHaveLength(2);
    await user.click(listButtons[1]);

    expect(mapScale()).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Detalle del croquis")).toBeInTheDocument();
  });

  it("keeps the map still when selecting a stand at a non-compact scale", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);
    const scaleBefore = mapScale();

    expect(scaleBefore).toBeGreaterThanOrEqual(0.75);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    expect(mapScale()).toBe(scaleBefore);
    expect(screen.getByLabelText("Detalle del croquis")).toBeInTheDocument();
  });
});

async function zoomOutUntilCompact(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const zoomOut = screen.getByRole("button", { name: "Alejar" });

  await user.click(zoomOut);
  await user.click(zoomOut);

  expect(mapScale()).toBeLessThan(0.75);
}

function mapScale(): number {
  const scale = document.querySelector("[data-scale]")?.getAttribute("data-scale");

  if (!scale) throw new Error("The map viewport must expose its scale through data-scale.");

  return Number.parseFloat(scale);
}

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
