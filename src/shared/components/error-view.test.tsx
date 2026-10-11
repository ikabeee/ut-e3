import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorView } from "@shared/components/error-view";

describe("ErrorView", () => {
  it("shows the error message in Spanish", () => {
    render(<ErrorView onRetry={jest.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();
    expect(document.title).toBe("Algo salió mal · UTG");
  });

  it("calls onRetry when the retry button is pressed", () => {
    const onRetry = jest.fn();
    render(<ErrorView onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("links back to the home page", () => {
    render(<ErrorView onRetry={jest.fn()} />);

    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("shows the digest only when there is one", () => {
    const { rerender } = render(<ErrorView onRetry={jest.fn()} />);
    expect(screen.queryByText(/Código:/)).not.toBeInTheDocument();

    rerender(<ErrorView onRetry={jest.fn()} digest="abc123" />);
    expect(screen.getByText("Código: abc123")).toBeInTheDocument();
  });
});
