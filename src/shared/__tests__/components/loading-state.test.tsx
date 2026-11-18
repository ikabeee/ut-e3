import { render, screen } from "@testing-library/react";
import { LoadingState } from "@shared/components/loading-state";

describe("LoadingState (S6)", () => {
  it("is a spinner named after what loads, with the same words visible next to it", () => {
    const { container } = render(<LoadingState label="Cargando el kiosko..." />);

    expect(screen.getByRole("status", { name: "Cargando el kiosko..." })).toHaveAttribute("data-slot", "spinner");
    expect(container).toHaveTextContent("Cargando el kiosko...");
  });
});
