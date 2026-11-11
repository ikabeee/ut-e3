import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivateForm } from "@features/accounts/components/activate-form";
import type { ActivationState } from "@features/accounts/lib/activation-actions";

describe("ActivateForm", () => {
  it("sends the token, the password and its confirmation", async () => {
    const { received, action } = recordingAction({ error: "" });

    render(<ActivateForm token="the-token" action={action} />);
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "a long enough password");
    await userEvent.type(screen.getByLabelText("Repite la contraseña"), "a long enough password");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("token")).toBe("the-token");
    expect(received[0].get("password")).toBe("a long enough password");
    expect(received[0].get("confirmation")).toBe("a long enough password");
  });

  it("shows what the server answered and keeps what was typed", async () => {
    const { action } = recordingAction({ error: "Las contraseñas no coinciden." });

    render(<ActivateForm token="the-token" action={action} />);
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "a long enough password");
    await userEvent.type(screen.getByLabelText("Repite la contraseña"), "another long password");
    await userEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Las contraseñas no coinciden.");
    expect(screen.getByLabelText("Contraseña nueva")).toHaveValue("a long enough password");
  });

  it("tells the minimum length before the person types", () => {
    render(<ActivateForm token="the-token" action={recordingAction({ error: "" }).action} />);

    expect(screen.getByText("Mínimo 12 caracteres.")).toBeInTheDocument();
  });
});

function recordingAction(result: ActivationState) {
  const received: FormData[] = [];

  const action = async (_previous: ActivationState | null, form: FormData): Promise<ActivationState> => {
    received.push(form);

    return result;
  };

  return { received, action };
}
