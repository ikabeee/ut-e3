import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearToasts } from "@features/tournament/__tests__/tournament-test-utils";
import { ConnectionToast } from "@features/tournament/components/connection-toast";

const MESSAGE = "Sin conexión. Se muestra el último estado recibido.";

afterEach(clearToasts);

describe("ConnectionToast (S6)", () => {
  it("shows the message as an alert toast, not as a bordered box in the page", () => {
    const { container } = render(<ConnectionToast isLost />);

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGE);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing while the connection is fine", () => {
    render(<ConnectionToast isLost={false} />);

    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });

  it("appears when the connection is lost and goes away when it comes back", async () => {
    const { rerender } = render(<ConnectionToast isLost={false} />);

    rerender(<ConnectionToast isLost />);

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();

    rerender(<ConnectionToast isLost={false} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });

  it("can be dismissed with its close button", async () => {
    render(<ConnectionToast isLost />);

    await userEvent.click(screen.getByRole("button", { name: /close|cerrar/i }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
  });
});
