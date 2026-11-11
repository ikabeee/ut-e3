import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  PublicBracketSwitch,
  type PublicBracketSwitchAction,
} from "@features/tournament/components/public-bracket-switch";
import type { PublicBracketActionState } from "@features/tournament/lib/public-bracket-actions";

describe("PublicBracketSwitch", () => {
  it("says the bracket is open, links to the public page and offers to close it", () => {
    render(<PublicBracketSwitch isEnabled action={recordingAction({ status: "done", message: "ok" }).action} />);

    expect(screen.getByText("Cualquiera puede ver el bracket en /tournament.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver la página pública" })).toHaveAttribute("href", "/tournament");
    expect(screen.getByRole("button", { name: "Cerrar al público" })).toBeInTheDocument();
  });

  it("says the bracket is closed and offers to reopen it", () => {
    render(
      <PublicBracketSwitch isEnabled={false} action={recordingAction({ status: "done", message: "ok" }).action} />,
    );

    expect(screen.getByText(/El bracket está cerrado/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir al público" })).toBeInTheDocument();
  });

  it("sends the opposite of the current value", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Bracket público cerrado." });

    render(<PublicBracketSwitch isEnabled action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar al público" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("enabled")).toBe("false");
    expect(await screen.findByRole("status")).toHaveTextContent("Bracket público cerrado.");
  });

  it("sends true when it is closed", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Bracket público abierto." });

    render(<PublicBracketSwitch isEnabled={false} action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir al público" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("enabled")).toBe("true");
  });

  it("shows why the server refused", async () => {
    const { action } = recordingAction({ status: "error", message: "No se pudo." });

    render(<PublicBracketSwitch isEnabled action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar al público" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo.");
  });
});

function recordingAction(result: PublicBracketActionState) {
  const received: FormData[] = [];

  const action: PublicBracketSwitchAction = async (_previous, form) => {
    received.push(form);

    return result;
  };

  return { received, action };
}
