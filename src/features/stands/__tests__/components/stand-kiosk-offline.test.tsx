import { webcrypto } from "node:crypto";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryVisitQueueStore } from "@features/stands/__tests__/lib/visit-queue-utils";
import { StandKiosk, type KioskActions, type KioskOfflineSupport } from "@features/stands/components/stand-kiosk";
import { buildPinFilter, mayBeRegisteredPin, type PinFilter } from "@features/stands/lib/pin-filter";
import type { QueuedVisit, QueuedVisitResult } from "@features/stands/lib/visit-queue";

// The PINs the downloaded filter knows; "11111" is not one of them and does not pass it (RF-78).
// Far from now: the registration is open for the whole test.
const OPEN_UNTIL = "2999-01-01T00:00:00.000Z";

const REGISTERED = ["12345", "22222", "33333", "44444"];

const UNREGISTERED = "11111";

let filter: PinFilter = { salt: "sal", iterations: 1, modulus: 50, values: [] };

let online = true;

let queue = createMemoryVisitQueueStore();

let sentBatches: QueuedVisit[][] = [];

let answer: (visits: QueuedVisit[]) => QueuedVisitResult[] = acceptAll;

const requests: string[] = [];

beforeAll(async () => {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });
  // jsdom has no Web Crypto; the kiosk hashes with the one of Node, as a browser would with its own.
  Object.defineProperty(globalThis.crypto, "subtle", { configurable: true, value: webcrypto.subtle });
  filter = await buildPinFilter(REGISTERED, "sal", 1);
});

beforeEach(() => {
  online = true;
  queue = createMemoryVisitQueueStore();
  sentBatches = [];
  requests.length = 0;
  answer = acceptAll;
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("StandKiosk without connection", () => {
  it("refuses a PIN that does not pass the filter, without the survey and without queueing it (UT-CI-34)", async () => {
    expect(await mayBeRegisteredPin(UNREGISTERED, filter)).toBe(false);

    renderKiosk();
    await goOffline();

    await typePin(UNREGISTERED);

    expect(await screen.findByRole("alert")).toHaveTextContent("PIN no reconocido, revísalo");
    expect(screen.queryByRole("heading", { name: "¿Qué te pareció?" })).not.toBeInTheDocument();
    expect(queue.pending.size).toBe(0);
    expect(requests).toEqual([]);
  });

  it("queues 3 visits answered on the kiosk and says how many wait (UT-CI-22)", async () => {
    renderKiosk();
    await goOffline();

    for (const pin of ["12345", "22222", "33333"]) await answerOffline(pin);

    expect(queue.pending.size).toBe(3);
    expect(await screen.findByText("Sin conexión · 3 visitas por enviar")).toBeInTheDocument();
    expect(requests).toEqual([]);
    expect(sentBatches).toEqual([]);
  });

  it("sends the queue when the network comes back and says everything was sent", async () => {
    renderKiosk();
    await goOffline();
    await answerOffline("12345");
    await goOnline();

    expect(await screen.findByText("Todo enviado")).toBeInTheDocument();
    expect(sentBatches).toHaveLength(1);
    expect(sentBatches[0][0]).toMatchObject({ pin: "12345", ratings: { gameRating: 5, standRating: 4, artRating: 3 } });
    expect(queue.pending.size).toBe(0);
  });

  it("lists the visit the server refused with its reason (RF-35, EC-16)", async () => {
    answer = (visits) => visits.map((visit) => ({ id: visit.id, status: "unknownVisitor" }));
    renderKiosk();
    await goOffline();
    await answerOffline("44444");
    await goOnline();

    const heading = await screen.findByRole("heading", { name: "No registradas" });

    expect(within(heading.parentElement ?? document.body).getByText("PIN no reconocido.")).toBeInTheDocument();
    expect(queue.rejected.size).toBe(1);
  });

  it("retries with a growing wait while the server does not answer", async () => {
    let failures = 2;

    answer = (visits) => {
      if (failures > 0) {
        failures -= 1;
        throw new Error("sin respuesta");
      }

      return acceptAll(visits);
    };

    renderKiosk();
    await goOffline();
    await answerOffline("12345");
    await goOnline();

    expect(await screen.findByText(/Sin respuesta del servidor/)).toBeInTheDocument();

    await advance(1000);
    await advance(2000);

    expect(await screen.findByText("Todo enviado")).toBeInTheDocument();
    expect(sentBatches).toHaveLength(3);
  });

  it("queues the survey answered on this screen when the server stops answering online", async () => {
    renderKiosk({
      submitVisit: async () => {
        throw new TypeError("Failed to fetch");
      },
    });

    await typePin("12345");
    await userEvent.click(await screen.findByRole("button", { name: "Calificar en esta pantalla" }));
    await rateAndSend();

    expect(await screen.findByText(/se enviará sola cuando vuelva la conexión/)).toBeInTheDocument();
    expect(sentBatches.length + queue.pending.size).toBeGreaterThan(0);
  });
});

function renderKiosk(overrides: Partial<KioskActions> = {}) {
  const actions: KioskActions = {
    requestVisit: async (_previous, form) => {
      requests.push(String(form.get("pin")));

      return { status: "waiting", pin: String(form.get("pin")), pendingVisitId: "pending-1" };
    },
    submitVisit: async () => ({ status: "done", message: "Tu visita quedó registrada." }),
    cancelVisit: async () => undefined,
    ...overrides,
  };

  const support: KioskOfflineSupport = {
    createStore: () => queue.store,
    sendBatch: async (visits) => {
      sentBatches.push(visits);

      return answer(visits);
    },
    loadPinFilter: async () => filter,
  };

  return render(
    <StandKiosk
      standCode="ZA-S3"
      gameName="Pixel Quest"
      closesAt={OPEN_UNTIL}
      actions={actions}
      createStatusLoader={() => async () => "waiting"}
      offlineSupport={support}
    />,
  );
}

function acceptAll(visits: QueuedVisit[]): QueuedVisitResult[] {
  return visits.map((visit) => ({ id: visit.id, status: "ok" }));
}

async function answerOffline(pin: string) {
  await typePin(pin);
  await rateAndSend();
  await screen.findByRole("heading", { name: "¡Gracias!" });
  await advance(4000);
  await screen.findByRole("heading", { name: "Escribe tu PIN" });
}

async function rateAndSend() {
  await screen.findByRole("heading", { name: "¿Qué te pareció?" });
  await rate("El juego", "5");
  await rate("El stand", "4");
  await rate("El arte", "3");
  await userEvent.click(screen.getByRole("button", { name: "Enviar y registrar mi visita" }));
}

async function typePin(pin: string) {
  await userEvent.type(screen.getByLabelText("PIN de 5 dígitos"), pin);
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

async function rate(question: string, value: string) {
  await userEvent.click(within(screen.getByRole("group", { name: question })).getByLabelText(value));
}

async function goOffline() {
  online = false;
  await act(async () => {
    window.dispatchEvent(new Event("offline"));
  });
}

async function goOnline() {
  online = true;
  await act(async () => {
    window.dispatchEvent(new Event("online"));
  });
}

async function advance(milliseconds: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds);
  });
}
