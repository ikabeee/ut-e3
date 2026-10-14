import { act, render, screen } from "@testing-library/react";
import { OfflineBanner } from "@features/offline/components/offline-banner";

const MESSAGE = "Sin conexión. Lo que ya visitaste sigue disponible.";

function setBrowserOnline(isOnline: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => isOnline });
}

afterEach(() => {
  setBrowserOnline(true);
});

describe("OfflineBanner", () => {
  it("keeps an empty status region while online", () => {
    render(<OfflineBanner getNextOffline={() => false} />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows the notice when Next detects failed requests", () => {
    render(<OfflineBanner getNextOffline={() => true} />);

    expect(screen.getByRole("status")).toHaveTextContent(MESSAGE);
  });

  it("shows the notice when the browser goes offline and hides it when it comes back", () => {
    render(<OfflineBanner getNextOffline={() => false} />);

    act(() => {
      setBrowserOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toHaveTextContent(MESSAGE);

    act(() => {
      setBrowserOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
