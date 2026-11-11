import { render, screen } from "@testing-library/react";
import { ErrorView } from "@features/site/components/error-view";

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
});
