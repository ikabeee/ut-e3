import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setNetwork } from "@features/pwa/__tests__/components/router-test-utils";
import { OfflineReconnect } from "@features/pwa/components/offline-reconnect";
import { RETRY_INTERVAL_MS } from "@features/pwa/hooks/use-offline-reconnect";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";

const COPY = PWA_COPY.offline;

const fetchMock = jest.fn();

const navigate = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock.mockReset();
  navigate.mockReset();
  Object.defineProperty(globalThis, "fetch", { value: fetchMock, configurable: true, writable: true });
  window.history.pushState({}, "", "/offline");
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  Reflect.deleteProperty(globalThis, "fetch");
});

describe("OfflineReconnect, with a network", () => {
  it("leaves /offline on its own when the page opens already online and the server answers", async () => {
    answer({ ok: true });

    renderReconnect();
    await settle();

    expect(fetchMock).toHaveBeenCalledWith("/passport", expect.objectContaining({ cache: "no-store" }));
    expect(navigate).toHaveBeenCalledWith("/passport");
  });

  it("goes to the page the visitor wanted, which the worker leaves in ?from=", async () => {
    window.history.pushState({}, "", "/offline?from=%2Fgames%2Fruta-9");
    answer({ ok: true });

    renderReconnect();
    await settle();

    expect(fetchMock).toHaveBeenCalledWith("/games/ruta-9", expect.anything());
    expect(navigate).toHaveBeenCalledWith("/games/ruta-9");
  });

  it("does not say Sin conexión, and says it has a network but no server, while the server does not answer", async () => {
    answer({ fails: true });

    renderReconnect();
    await settle();

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByText(COPY.reconnecting.unreachable)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: PWA_COPY.connection.label })).toHaveTextContent(
      PWA_COPY.connection.online,
    );
    expect(screen.queryByText(PWA_COPY.connection.offline)).not.toBeInTheDocument();
    expect(screen.queryByText(COPY.title)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: COPY.reconnecting.title })).toBeInTheDocument();
  });

  it("retries every few seconds and leaves as soon as the server answers", async () => {
    answer({ fails: true });
    renderReconnect();
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTimeAsync(RETRY_INTERVAL_MS));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(navigate).not.toHaveBeenCalled();

    answer({ ok: true });
    await act(() => jest.advanceTimersByTimeAsync(RETRY_INTERVAL_MS));

    expect(navigate).toHaveBeenCalledWith("/passport");
  });

  it("checks again when the page becomes visible", async () => {
    answer({ fails: true });
    renderReconnect();
    await settle();

    answer({ ok: true });
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await settle();

    expect(navigate).toHaveBeenCalledWith("/passport");
  });

  it("does not leave when the answer is the offline page itself", async () => {
    fetchMock.mockResolvedValue({ ok: true, url: "http://localhost/offline" });

    renderReconnect();
    await settle();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not stack requests: a slow check blocks the next one until it ends", async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    renderReconnect();
    await act(() => jest.advanceTimersByTimeAsync(RETRY_INTERVAL_MS * 3));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("offers a Reintentar button that checks right away", async () => {
    answer({ fails: true });
    renderReconnect();
    await settle();
    answer({ ok: true });

    await userEvent
      .setup({ advanceTimers: jest.advanceTimersByTime })
      .click(screen.getByRole("button", { name: COPY.retry }));
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith("/passport");
  });
});

describe("OfflineReconnect, without a network", () => {
  it("says Sin conexión, asks nothing of the server and keeps the Reintentar button visible", async () => {
    setNetwork(false);

    renderReconnect();
    await act(() => jest.advanceTimersByTimeAsync(RETRY_INTERVAL_MS * 2));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: COPY.title })).toBeInTheDocument();
    expect(screen.getByText(COPY.description)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: PWA_COPY.connection.label })).toHaveTextContent(
      PWA_COPY.connection.offline,
    );
    expect(screen.getByRole("button", { name: COPY.retry })).toBeVisible();
  });

  it("checks the server when the browser says the network returned", async () => {
    setNetwork(false);
    renderReconnect();
    await settle();

    answer({ ok: true });
    act(() => setNetwork(true));
    await settle();

    expect(navigate).toHaveBeenCalledWith("/passport");
  });
});

function renderReconnect() {
  return render(<OfflineReconnect reconnectTo="/passport" navigate={navigate} />);
}

function answer({ ok = true, fails = false }: { ok?: boolean; fails?: boolean }) {
  if (fails) fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  else fetchMock.mockResolvedValue({ ok, url: "http://localhost/passport" });
}

// Lets the pending promises of the check settle inside act, without moving the clock.
async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
