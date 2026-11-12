import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterDesk } from "@features/support/components/register-desk";
import type { DeskRegistrationState } from "@features/support/lib/support-actions";

const SENT: FormData[] = [];

beforeEach(() => {
  SENT.length = 0;
});

const REGISTERED: DeskRegistrationState = {
  status: "registered",
  fullName: "Ana Pérez",
  gamertag: "Desk_Ana",
  pin: "04821",
  claimPath: "/passport/claim/abc",
  enrollment: "enrolled",
};

describe("RegisterDesk", () => {
  it("asks for the name, the gamertag and the email", () => {
    renderDesk({ canEnrollInTournament: false });

    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Gamertag")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeRequired();
    expect(screen.getByRole("button", { name: "Registrar visitante" })).toBeInTheDocument();
  });

  it("offers the tournament only during the on-site sign-up", () => {
    const { unmount } = renderDesk({ canEnrollInTournament: false });

    expect(screen.queryByText("Inscribir también en el torneo de KOF")).not.toBeInTheDocument();

    unmount();
    renderDesk({ canEnrollInTournament: true });

    expect(screen.getByText("Inscribir también en el torneo de KOF")).toBeInTheDocument();
  });

  it("shows the field errors that the server returns and keeps what was typed", async () => {
    renderDesk({
      canEnrollInTournament: false,
      register: async () => ({
        status: "error",
        message: "Revisa los datos marcados.",
        fieldErrors: { gamertag: "Ese gamertag ya está registrado." },
      }),
    });

    await fillAndSend();

    expect(await screen.findByText("Ese gamertag ya está registrado.")).toBeInTheDocument();
    expect(screen.getByLabelText("Gamertag")).toHaveValue("Desk_Ana");
  });

  it("shows the PIN, the link and the tournament result, and starts over for the next visitor", async () => {
    renderDesk({ canEnrollInTournament: true, register: async () => REGISTERED });

    await fillAndSend();

    expect(await screen.findByTestId("desk-pin")).toHaveTextContent("04821");
    expect(screen.getByLabelText("Enlace de acceso")).toHaveValue(`${window.location.origin}/passport/claim/abc`);
    expect(screen.getByRole("status")).toHaveTextContent("También quedó inscrito en el torneo de KOF.");

    await userEvent.click(screen.getByRole("button", { name: "Registrar otro visitante" }));

    expect(screen.queryByTestId("desk-pin")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Gamertag")).toHaveValue("");
  });

  it("sends the checkbox of the tournament only when it is ticked", async () => {
    renderDesk({ canEnrollInTournament: true });

    await userEvent.click(screen.getByText("Inscribir también en el torneo de KOF"));
    await fillAndSend();

    expect(SENT[0]?.get("enrollInTournament")).toBe("on");
  });

  function renderDesk(options: {
    canEnrollInTournament: boolean;
    register?: (previous: DeskRegistrationState | null, form: FormData) => Promise<DeskRegistrationState>;
  }) {
    const register =
      options.register ??
      (async (_previous: DeskRegistrationState | null, form: FormData): Promise<DeskRegistrationState> => {
        SENT.push(form);

        return { status: "error", message: "x" };
      });

    return render(<RegisterDesk register={register} canEnrollInTournament={options.canEnrollInTournament} />);
  }

  async function fillAndSend() {
    await userEvent.type(screen.getByLabelText("Nombre completo"), "Ana Pérez");
    await userEvent.type(screen.getByLabelText("Gamertag"), "Desk_Ana");
    await userEvent.type(screen.getByLabelText("Correo"), "ana@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Registrar visitante" }));
  }
});
