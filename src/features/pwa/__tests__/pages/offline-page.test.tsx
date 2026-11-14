import { render, screen } from "@testing-library/react";
import { createRouter, setNetwork, withRouter } from "@features/pwa/__tests__/components/router-test-utils";
import { OfflinePage, offlinePageMetadata } from "@features/pwa/pages/offline-page";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";
import { savePassportSnapshot } from "@features/visitors/lib/passport-snapshot-storage";

const COPY = PWA_COPY.offline;

const fetchMock = jest.fn();

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset().mockReturnValue(new Promise(() => undefined));
  Object.defineProperty(globalThis, "fetch", { value: fetchMock, configurable: true, writable: true });
});

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "fetch");
});

describe("OfflinePage (RNF-14, item 4)", () => {
  it("shows the passport that the phone saved, with the notice of how old it is", () => {
    setNetwork(false);
    savePassportSnapshot({
      passport: { gamertag: "PlayerOne", pin: "12345" },
      visits: { visitCount: 3, stands: [{ code: "ZA-S1", visited: true, gameName: null }], tickets: [] },
      now: new Date(Date.now() - 2 * 60_000),
    });

    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: COPY.title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: COPY.retry })).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("Sin conexión. Datos de hace 2 min")).toBeInTheDocument();
    expect(screen.queryByText(COPY.noCopyTitle)).not.toBeInTheDocument();
  });

  it("with a network it does not say Sin conexión anywhere next to the En línea indicator", () => {
    savePassportSnapshot({
      passport: { gamertag: "PlayerOne", pin: "12345" },
      visits: { visitCount: 3, stands: [{ code: "ZA-S1", visited: true, gameName: null }], tickets: [] },
      now: new Date(Date.now() - 2 * 60_000),
    });

    renderPage();

    expect(screen.getAllByRole("status").map((node) => node.textContent)).toEqual(
      expect.arrayContaining([PWA_COPY.connection.online]),
    );
    expect(screen.queryByText(/Sin conexión/)).not.toBeInTheDocument();
    expect(screen.getByText("Datos guardados hace 2 min")).toBeInTheDocument();
  });

  it("explains that there is no saved copy and links the pages that do work offline", () => {
    renderPage();

    expect(screen.getByText(COPY.noCopyTitle)).toBeInTheDocument();
    expect(screen.getByText(COPY.noCopy)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COPY.games })).toHaveAttribute("href", "/games");
    expect(screen.getByRole("link", { name: COPY.home })).toHaveAttribute("href", "/");
    expect(screen.queryByText("12345")).not.toBeInTheDocument();
  });

  it("shows whether the phone has a network", () => {
    renderPage();

    expect(screen.getByRole("status", { name: PWA_COPY.connection.label })).toBeInTheDocument();
  });

  it("is not indexed and has /offline as canonical address", () => {
    expect(offlinePageMetadata.robots).toEqual({ index: false, follow: false });
    expect(offlinePageMetadata.alternates?.canonical).toBe("/offline");
  });
});

function renderPage() {
  return render(
    withRouter(
      createRouter(() => undefined),
      <OfflinePage />,
    ),
  );
}
