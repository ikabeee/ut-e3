import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecoveryDesk } from "@features/support/components/recovery-desk";
import type { CandidateView, RecoveryState, SearchState } from "@features/support/lib/support-actions";
import { encodeWithQuietZone, readMatrixFromPath } from "@shared/__tests__/lib/qr-test-utils";
import { buildQrCode } from "@shared/lib/qr-code";

const SEARCHED: FormData[] = [];

const RECOVERED_FORMS: FormData[] = [];

beforeEach(() => {
  SEARCHED.length = 0;
  RECOVERED_FORMS.length = 0;
});

const ANA: CandidateView = {
  visitorId: "visitor-1",
  fullName: "Ana Pérez",
  gamertag: "Neo_01",
  maskedEmail: "ne***@gmail.com",
  registeredAt: "2026-11-13T18:05:00.000Z",
  standsVisited: 4,
};

const OTHER_ANA: CandidateView = {
  ...ANA,
  visitorId: "visitor-2",
  gamertag: "Trin_02",
  maskedEmail: "tr***@hotmail.com",
  registeredAt: "2026-11-14T16:30:00.000Z",
  standsVisited: 1,
};

const RECOVERED: RecoveryState = {
  status: "recovered",
  fullName: "Ana Pérez",
  gamertag: "Neo_01",
  registeredAt: "2026-11-13T18:00:00.000Z",
  claimPath: "/passport/claim/abc",
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("RecoveryDesk", () => {
  it("asks for an email, a gamertag or a name in one field", () => {
    renderDesk();

    expect(screen.getByLabelText("Correo, gamertag o nombre completo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar pasaporte" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recuperar este pasaporte" })).not.toBeInTheDocument();
  });

  it("keeps what was typed and shows the message when nothing matches", async () => {
    renderDesk({ search: async () => ({ status: "error", message: "No hay ningún pasaporte con ese dato." }) });

    await search("Nadie");

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay ningún pasaporte con ese dato.");
    expect(screen.getByLabelText("Correo, gamertag o nombre completo")).toHaveValue("Nadie");
    expect(SEARCHED[0].get("query")).toBe("Nadie");
  });

  it("lists the passports with the data to verify: gamertag, stands, masked email and registration time", async () => {
    renderDesk({ search: async () => ({ status: "found", candidates: [ANA, OTHER_ANA] }) });

    await search("Ana Pérez");

    const cards = await screen.findAllByTestId("recovery-candidate");

    expect(screen.getByText("2 pasaportes coinciden")).toBeInTheDocument();
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("Gamertag: Neo_01")).toBeInTheDocument();
    expect(within(cards[0]).getByText("4 stands visitados")).toBeInTheDocument();
    expect(within(cards[0]).getByText("Correo: ne***@gmail.com")).toBeInTheDocument();
    expect(within(cards[0]).getByText(/^Registrado el 13\.11\.2026 a las /)).toBeInTheDocument();
    expect(within(cards[1]).getByText("1 stand visitado")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b\d{5}\b/);
  });

  it("recovers the passport that the agent chose, not the first one", async () => {
    renderDesk({ search: async () => ({ status: "found", candidates: [ANA, OTHER_ANA] }) });

    await search("Ana Pérez");

    const cards = await screen.findAllByTestId("recovery-candidate");

    await userEvent.click(within(cards[1]).getByRole("button", { name: "Recuperar este pasaporte" }));

    expect(await screen.findByRole("heading", { name: "Pasaporte recuperado" })).toBeInTheDocument();
    expect(RECOVERED_FORMS[0].get("visitorId")).toBe("visitor-2");
  });

  it("shows why a recovery was refused and keeps the list", async () => {
    renderDesk({
      search: async () => ({ status: "found", candidates: [ANA] }),
      recover: async () => ({ status: "error", message: "Este pasaporte ya se recuperó 3 veces." }),
    });

    await search("Neo_01");
    await userEvent.click(await screen.findByRole("button", { name: "Recuperar este pasaporte" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este pasaporte ya se recuperó 3 veces.");
    expect(screen.getAllByTestId("recovery-candidate")).toHaveLength(1);
  });

  it("shows who was recovered and the link with the origin, and clears for the next visitor", async () => {
    await recoverFirstCandidate();

    expect(screen.getByText("Ana Pérez · Neo_01")).toBeInTheDocument();
    expect(screen.getByText("Registrado el 13.11.2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Enlace de acceso")).toHaveValue(`${window.location.origin}/passport/claim/abc`);

    await userEvent.click(screen.getByRole("button", { name: "Recuperar otro pasaporte" }));

    expect(screen.getByLabelText("Correo, gamertag o nombre completo")).toHaveValue("");
    expect(screen.queryByLabelText("Enlace de acceso")).not.toBeInTheDocument();
  });

  it("shows the link as a QR code that encodes exactly the same link as the text field (RF-69)", async () => {
    const { container } = await recoverFirstCandidate();

    const link = `${window.location.origin}/passport/claim/abc`;
    const qr = await screen.findByRole("img", { name: "Código QR para abrir el pasaporte" });
    const { size } = buildQrCode(link);

    expect(screen.getByLabelText("Enlace de acceso")).toHaveValue(link);
    expect(qr).toHaveAttribute("viewBox", `0 0 ${size} ${size}`);
    expect(readMatrixFromPath(container.querySelector("svg path")?.getAttribute("d") ?? "", size)).toEqual(
      encodeWithQuietZone(link),
    );
  });

  it("copies the link with the Copiar enlace button and says so", async () => {
    const writeText = jest.fn(async () => undefined);

    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    await recoverFirstCandidate();
    await userEvent.click(await screen.findByRole("button", { name: "Copiar enlace" }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/passport/claim/abc`);
    expect(await screen.findByRole("button", { name: "Enlace copiado" })).toBeInTheDocument();
  });

  it("says when the link could not be copied, and the text field stays as the backup", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("blocked");
        },
      },
    });
    await recoverFirstCandidate();
    await userEvent.click(await screen.findByRole("button", { name: "Copiar enlace" }));

    expect(await screen.findByRole("button", { name: "No se pudo copiar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Enlace de acceso")).toBeInTheDocument();
  });

  it("shows no QR code while the desk has no recovered passport", () => {
    renderDesk();

    expect(screen.queryByRole("img", { name: "Código QR para abrir el pasaporte" })).not.toBeInTheDocument();
  });
});

interface DeskActions {
  search?: (form: FormData) => Promise<SearchState>;
  recover?: (form: FormData) => Promise<RecoveryState>;
}

async function recoverFirstCandidate() {
  const rendered = renderDesk({ search: async () => ({ status: "found", candidates: [ANA] }) });

  await search("Neo_01");
  await userEvent.click(await screen.findByRole("button", { name: "Recuperar este pasaporte" }));
  await screen.findByRole("heading", { name: "Pasaporte recuperado" });

  return rendered;
}

function renderDesk({ search, recover }: DeskActions = {}) {
  return render(
    <RecoveryDesk
      search={async (_previous, form) => {
        SEARCHED.push(form);

        return search ? search(form) : { status: "error", message: "x" };
      }}
      recover={async (_previous, form) => {
        RECOVERED_FORMS.push(form);

        return recover ? recover(form) : RECOVERED;
      }}
    />,
  );
}

async function search(query: string) {
  await userEvent.type(screen.getByLabelText("Correo, gamertag o nombre completo"), query);
  await userEvent.click(screen.getByRole("button", { name: "Buscar pasaporte" }));
}
