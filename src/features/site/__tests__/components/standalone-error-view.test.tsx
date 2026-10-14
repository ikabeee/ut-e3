import { fireEvent, render, screen } from "@testing-library/react";
import { StandaloneErrorView } from "@features/site/components/standalone-error-view";

describe("StandaloneErrorView", () => {
  it("renders ErrorView and executes onRetry when retry is pressed", () => {
    const onRetry = jest.fn();

    render(<StandaloneErrorView onRetry={onRetry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
