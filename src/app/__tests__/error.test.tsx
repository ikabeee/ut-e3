import { fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "@app/error";

describe("ErrorPage", () => {
  it("logs the error and retries the segment when asked", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("boom"), { digest: "123" });
    const retry = jest.fn();

    render(<ErrorPage error={error} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(consoleError).toHaveBeenCalledWith(error);
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Código: 123")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
