import { fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "@app/error";

describe("src/app/error.tsx", () => {
  it("shows the error in Spanish, logs it and retries the segment", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("fetch failed"), { digest: "1603236852" });
    const retry = jest.fn();

    render(<ErrorPage error={error} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();
    expect(screen.getByText("Código: 1603236852")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
    expect(consoleError).toHaveBeenCalledWith(error);
    expect(retry).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
