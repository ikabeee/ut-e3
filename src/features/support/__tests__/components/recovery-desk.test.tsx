import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecoveryDesk } from "@features/support/components/recovery-desk";
import type { RecoveryState } from "@features/support/lib/support-actions";

const SENT: FormData[] = [];

beforeEach(() => {
  SENT.length = 0;
});

describe("RecoveryDesk", () => {
  it("asks for the full name and the gamertag", () => {
    renderDesk(async () => ({ status: "error", message: "x" }));

    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Gamertag")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recuperar pasaporte" })).toBeInTheDocument();
  });

  it("keeps what was typed and shows the message when the identity does not match", async () => {
    renderDesk(async () => ({ status: "error", message: "No coincide" }));

    await fillAndSend("Ana Pérez", "Neo_01");

    expect(await screen.findByRole("alert")).toHaveTextContent("No coincide");
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Pérez");
    expect(screen.getByLabelText("Gamertag")).toHaveValue("Neo_01");
    expect(SENT[0].get("gamertag")).toBe("Neo_01");
  });

  it("shows who was recovered and the link with the origin, and clears for the next visitor", async () => {
    renderDesk(async () => ({
      status: "recovered",
      fullName: "Ana Pérez",
      gamertag: "Neo_01",
      registeredAt: "2026-11-13T18:00:00.000Z",
      claimPath: "/passport/claim/abc",
    }));

    await fillAndSend("Ana Pérez", "Neo_01");

    expect(await screen.findByRole("heading", { name: "Pasaporte recuperado" })).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez · Neo_01")).toBeInTheDocument();
    expect(screen.getByText("Registrado el 13.11.2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Enlace de acceso")).toHaveValue(`${window.location.origin}/passport/claim/abc`);

    await userEvent.click(screen.getByRole("button", { name: "Recuperar otro pasaporte" }));

    expect(screen.getByLabelText("Nombre completo")).toHaveValue("");
    expect(screen.queryByLabelText("Enlace de acceso")).not.toBeInTheDocument();
  });
});

function renderDesk(result: (form: FormData) => Promise<RecoveryState>) {
  render(
    <RecoveryDesk
      recover={async (_previous, form) => {
        SENT.push(form);

        return result(form);
      }}
    />,
  );
}

async function fillAndSend(fullName: string, gamertag: string) {
  await userEvent.type(screen.getByLabelText("Nombre completo"), fullName);
  await userEvent.type(screen.getByLabelText("Gamertag"), gamertag);
  await userEvent.click(screen.getByRole("button", { name: "Recuperar pasaporte" }));
}
