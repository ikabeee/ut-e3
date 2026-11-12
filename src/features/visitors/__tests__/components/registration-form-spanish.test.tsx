import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "@features/visitors/components/registration-form";
import type { RegistrationState } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.form;

// S6: the validation errors of the registration form are shown in Spanish from the copy file, never with the
// browser's own messages (audit H9-1). Each message below is the literal Spanish text the visitor reads; it must match
// the copy file so the component never falls back to the browser wording.
function createCollectingAction(received: FormData[]) {
  return async (_previous: RegistrationState | null, form: FormData): Promise<RegistrationState> => {
    received.push(form);

    return {};
  };
}

describe("RegistrationForm Spanish validation (S6)", () => {
  it("shows the Spanish message of the copy when a required field is empty, without calling the action", async () => {
    const received: FormData[] = [];

    const action = createCollectingAction(received);

    render(<RegistrationForm action={action} />);
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(await screen.findByText("El nombre completo es obligatorio.")).toBeInTheDocument();
    expect(VISITORS_COPY.errors.fullNameRequired).toBe("El nombre completo es obligatorio.");
    expect(received).toHaveLength(0);
  });

  it("shows the Spanish message of the copy for a malformed email, without calling the action", async () => {
    const received: FormData[] = [];

    const action = createCollectingAction(received);

    render(<RegistrationForm action={action} />);
    await userEvent.type(screen.getByLabelText(COPY.fullNameLabel), "Thomas Anderson");
    await userEvent.type(screen.getByLabelText(COPY.gamertagLabel), "Neo");
    await userEvent.type(screen.getByLabelText(COPY.emailLabel), "no-es-correo");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(await screen.findByText("Ingresa un correo electrónico válido.")).toBeInTheDocument();
    expect(VISITORS_COPY.errors.emailInvalid).toBe("Ingresa un correo electrónico válido.");
    expect(received).toHaveLength(0);
  });

  it("still sends valid values to the action", async () => {
    const received: FormData[] = [];

    const action = createCollectingAction(received);

    render(<RegistrationForm action={action} />);
    await userEvent.type(screen.getByLabelText(COPY.fullNameLabel), "Thomas Anderson");
    await userEvent.type(screen.getByLabelText(COPY.gamertagLabel), "Neo");
    await userEvent.type(screen.getByLabelText(COPY.emailLabel), "neo@matrix.org");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(received).toHaveLength(1);
    expect(received[0].get("fullName")).toBe("Thomas Anderson");
    expect(received[0].get("gamertag")).toBe("Neo");
    expect(received[0].get("email")).toBe("neo@matrix.org");
  });
});
