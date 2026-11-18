import { render, screen } from "@testing-library/react";
import { PanelSkeleton } from "@shared/components/panel-skeleton";

describe("PanelSkeleton (S12)", () => {
  it("announces what loads and shows bars instead of a spinner", () => {
    const { container } = render(<PanelSkeleton label="Cargando el panel..." />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando el panel...");
    expect(container.querySelectorAll('[data-slot="spinner"]')).toHaveLength(0);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("takes the shape of a form when the panel is one: a bar per label and field and one for the button", () => {
    const { container } = render(<PanelSkeleton label="Cargando tu juego..." layout="form" />);

    expect(container.querySelectorAll(".h-11.w-full")).toHaveLength(4);
  });
});
