import { act, render, screen } from "@testing-library/react";
import { useOffline } from "next/offline";
import { OfflineBanner } from "@features/offline/components/offline-banner";

jest.mock("next/offline", () => ({ useOffline: jest.fn(() => false) }));

const MESSAGE = "Sin conexión. Lo que ya visitaste sigue disponible.";

function setBrowserOnline(isOnline: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => isOnline });
}

afterEach(() => {
  setBrowserOnline(true);
  jest.mocked(useOffline).mockReturnValue(false);
});

describe("OfflineBanner", () => {
  it("keeps an empty status region while online", () => {
    render(<OfflineBanner />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows the notice when Next detects failed requests", () => {
    jest.mocked(useOffline).mockReturnValue(true);
    render(<OfflineBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(MESSAGE);
  });

  it("shows the notice when the browser goes offline and hides it when it comes back", () => {
    render(<OfflineBanner />);

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
