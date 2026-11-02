import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StandKiosk, type KioskActions } from "@features/stands/components/stand-kiosk";
import type { VisitStatus } from "@features/stands/lib/pending-visit";
import type { RequestVisitState, VisitActionState } from "@features/stands/lib/stands-actions";

const SENT_SURVEYS: FormData[] = [];

const CANCELLED: string[] = [];

let status: VisitStatus = "waiting";

let statusFails = false;

beforeEach(() => {
  SENT_SURVEYS.length = 0;
  CANCELLED.length = 0;
  status = "waiting";
  statusFails = false;
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("StandKiosk", () => {
  it("names the stand and asks for the PIN first", () => {
    renderKiosk();

    expect(screen.getByText("Stand ZA-S1 · Pixel Quest")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Escribe tu PIN" })).toBeInTheDocument();
    expect(screen.getByLabelText("PIN de 5 dígitos")).toHaveAttribute("inputmode", "numeric");
    expect(screen.queryByRole("heading", { name: "¿Qué te pareció?" })).not.toBeInTheDocument();
  });

  it("keeps the typed PIN and shows why when the PIN is refused", async () => {
    renderKiosk({ requestVisit: async () => ({ status: "error", message: "PIN no reconocido, revísalo" }) });

    await typePin("99999");

    expect(await screen.findByRole("alert")).toHaveTextContent("PIN no reconocido, revísalo");
    expect(screen.getByLabelText("PIN de 5 dígitos")).toHaveValue("99999");
    expect(screen.queryByRole("heading", { name: "Esperando la calificación" })).not.toBeInTheDocument();
  });

  it("waits for the visitor to rate from the passport instead of opening the survey", async () => {
    renderKiosk();

    await typePin("12345");

    expect(await screen.findByRole("heading", { name: "Esperando la calificación" })).toBeInTheDocument();
    expect(screen.getByText(/abra su pasaporte/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "¿Qué te pareció?" })).not.toBeInTheDocument();
  });

  it("thanks once the visitor rated on the phone, and goes back to the PIN by itself", async () => {
    renderKiosk();

    await typePin("12345");
    await screen.findByRole("heading", { name: "Esperando la calificación" });
    status = "answered";
    await advance(2000);

    expect(await screen.findByRole("heading", { name: "¡Gracias!" })).toBeInTheDocument();
    expect(screen.queryByText(/[1-5]\s*\/\s*5/)).not.toBeInTheDocument();

    await advance(4000);

    expect(screen.getByRole("heading", { name: "Escribe tu PIN" })).toBeInTheDocument();
    expect(screen.getByLabelText("PIN de 5 dígitos")).toHaveValue("");
  });

  it("goes back to the PIN with a notice when the time to rate ran out", async () => {
    renderKiosk();

    await typePin("12345");
    await screen.findByRole("heading", { name: "Esperando la calificación" });
    status = "expired";
    await advance(2000);

    expect(await screen.findByRole("heading", { name: "Escribe tu PIN" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Se acabó el tiempo para calificar");
  });

  it("keeps waiting and says so when the server cannot be reached", async () => {
    renderKiosk();

    await typePin("12345");
    await screen.findByRole("heading", { name: "Esperando la calificación" });
    statusFails = true;
    await advance(2000);

    expect(await screen.findByText(/Sin conexión con el servidor/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Esperando la calificación" })).toBeInTheDocument();
  });

  it("cancels the waiting visit and goes back to an empty PIN screen", async () => {
    renderKiosk();

    await typePin("12345");
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("heading", { name: "Escribe tu PIN" })).toBeInTheDocument();
    expect(screen.getByLabelText("PIN de 5 dígitos")).toHaveValue("");
    expect(CANCELLED).toEqual(["pending-1"]);
  });

  it("lets the visitor rate on this screen when the phone has no signal", async () => {
    renderKiosk();

    await reachSurvey();
    await rate("El juego", "5");
    await rate("El stand", "4");
    await rate("El arte", "3");
    await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));

    expect(await screen.findByRole("heading", { name: "¡Gracias!" })).toBeInTheDocument();
    expect(SENT_SURVEYS.map((form) => Object.fromEntries(form.entries()))).toEqual([
      { pin: "12345", gameRating: "5", standRating: "4", artRating: "3" },
    ]);
  });

  it("does not send the survey until the three questions are answered", async () => {
    renderKiosk();

    await reachSurvey();
    await rate("El juego", "5");
    await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));

    expect(SENT_SURVEYS).toHaveLength(0);
  });

  it("stays on the survey and shows why the server refused the visit", async () => {
    renderKiosk({
      submitVisit: async () => ({ status: "error", message: "Este PIN ya registró su visita a este stand." }),
    });

    await reachSurvey();
    await rate("El juego", "2");
    await rate("El stand", "2");
    await rate("El arte", "2");
    await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este PIN ya registró su visita a este stand.");
    expect(screen.getByRole("heading", { name: "¿Qué te pareció?" })).toBeInTheDocument();
  });

  it("drops the waiting visit and returns to the PIN when the survey is cancelled", async () => {
    renderKiosk();

    await reachSurvey();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("heading", { name: "Escribe tu PIN" })).toBeInTheDocument();
    expect(CANCELLED).toEqual(["pending-1"]);
  });
});

function renderKiosk(overrides: Partial<KioskActions> = {}) {
  const actions: KioskActions = {
    requestVisit: async (_previous: RequestVisitState | null, form: FormData) => ({
      status: "waiting",
      pin: String(form.get("pin")),
      pendingVisitId: "pending-1",
    }),
    submitVisit: async (_previous: VisitActionState | null, form: FormData) => {
      SENT_SURVEYS.push(form);

      return { status: "done", message: "Tu visita quedó registrada." };
    },
    cancelVisit: async (pendingVisitId: string) => {
      CANCELLED.push(pendingVisitId);
    },
    ...overrides,
  };

  return render(
    <StandKiosk standCode="ZA-S1" gameName="Pixel Quest" actions={actions} createStatusLoader={createStatusLoader} />,
  );
}

function createStatusLoader() {
  return async () => {
    if (statusFails) throw new Error("sin conexión");

    return status;
  };
}

async function reachSurvey() {
  await typePin("12345");
  await userEvent.click(await screen.findByRole("button", { name: "Calificar en esta pantalla" }));
  await screen.findByRole("heading", { name: "¿Qué te pareció?" });
}

async function typePin(pin: string) {
  await userEvent.type(screen.getByLabelText("PIN de 5 dígitos"), pin);
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

async function rate(question: string, value: string) {
  await userEvent.click(within(screen.getByRole("group", { name: question })).getByLabelText(value));
}

async function advance(milliseconds: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds);
  });
}
