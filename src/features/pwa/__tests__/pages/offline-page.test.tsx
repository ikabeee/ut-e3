import { render, screen } from "@testing-library/react";
import { createRouter, withRouter } from "@features/pwa/__tests__/components/router-test-utils";
import { OfflinePage, offlinePageMetadata } from "@features/pwa/pages/offline-page";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";
import { savePassportSnapshot } from "@features/visitors/lib/passport-snapshot-storage";

const COPY = PWA_COPY.offline;

beforeEach(() => {
  window.localStorage.clear();
});

describe("OfflinePage (RNF-14, item 4)", () => {
  it("shows the passport that the phone saved, with the notice of how old it is", () => {
    savePassportSnapshot({
      passport: { gamertag: "PlayerOne", pin: "12345" },
      visits: { visitCount: 3, stands: [{ code: "ZA-S1", visited: true, gameName: null }], tickets: [] },
      now: new Date(Date.now() - 2 * 60_000),
    });

    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: COPY.title })).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("Sin conexión. Datos de hace 2 min")).toBeInTheDocument();
    expect(screen.queryByText(COPY.noCopyTitle)).not.toBeInTheDocument();
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
