import { render, screen } from "@testing-library/react";
import { ErrorView } from "@features/site/components/error-view";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const DESCRIPTION =
  "No pudimos cargar esta página. Revisa tu conexión e intenta de nuevo en unos segundos, o vuelve al inicio.";

describe("ErrorView", () => {
  it("names the tab, because error boundaries take no metadata", () => {
    render(<ErrorView homeHref="/" onRetry={jest.fn()} />);

    expect(document.title).toBe("Algo salió mal · PIXEL & CODE");
  });

  it("shows the digest only when there is one", () => {
    const { rerender } = render(<ErrorView homeHref="/" onRetry={jest.fn()} />);

    expect(screen.queryByText(/Código:/)).not.toBeInTheDocument();

    rerender(<ErrorView homeHref="/" onRetry={jest.fn()} digest="abc123" />);

    expect(screen.getByText("Código: abc123")).toBeInTheDocument();
  });

  it("tells what went wrong in a toast and keeps only the heading and the ways out on the page (S7)", () => {
    const { container } = renderWithToasts(<ErrorView homeHref="/" onRetry={jest.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent(DESCRIPTION);
    expect(container).not.toHaveTextContent(DESCRIPTION);
    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
