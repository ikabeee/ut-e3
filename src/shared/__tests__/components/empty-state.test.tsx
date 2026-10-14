import { render, screen } from "@testing-library/react";
import { Magnifier } from "@gravity-ui/icons";
import { EmptyState } from "@shared/components/empty-state";

describe("EmptyState", () => {
  it("renders title, description and children centered", () => {
    render(
      <EmptyState icon={Magnifier} title="No hay resultados" description="Intenta buscar con otros términos">
        <button type="button">Restablecer</button>
      </EmptyState>,
    );

    expect(screen.getByText("No hay resultados")).toBeInTheDocument();
    expect(screen.getByText("Intenta buscar con otros términos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restablecer" })).toBeInTheDocument();

    const container = screen.getByText("No hay resultados").closest('[data-slot="empty-state"]');
    expect(container).toHaveClass("flex", "flex-col", "items-center", "justify-center", "text-center");
  });

  it("renders a Gravity UI icon component properly with aria-hidden", () => {
    const { container } = render(<EmptyState icon={Magnifier} title="Sin elementos" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const iconWrapper = svg?.parentElement;
    expect(iconWrapper).toHaveAttribute("aria-hidden", "true");
  });

  it("supports different sizes and variants", () => {
    const { rerender } = render(<EmptyState title="Pequeño" size="sm" variant="subtle" />);

    let element = screen.getByText("Pequeño").closest('[data-slot="empty-state"]');
    expect(element).toHaveClass("px-3", "py-5", "border-border");

    rerender(<EmptyState title="Grande" size="lg" variant="plain" />);
    element = screen.getByText("Grande").closest('[data-slot="empty-state"]');
    expect(element).toHaveClass("px-6", "py-12");
  });
});
