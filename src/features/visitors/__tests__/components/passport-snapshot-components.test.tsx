import { act, render, screen } from "@testing-library/react";
import { ClearPassportSnapshot } from "@features/visitors/components/clear-passport-snapshot";
import { OfflinePassport } from "@features/visitors/components/offline-passport";
import { PassportSnapshotSaver } from "@features/visitors/components/passport-snapshot-saver";
import { PASSPORT_SNAPSHOT_KEY, parseSnapshot } from "@features/visitors/lib/passport-snapshot";
import { savePassportSnapshot } from "@features/visitors/lib/passport-snapshot-storage";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const PASSPORT = { gamertag: "PlayerOne", pin: "12345" };

const VISITS = {
  visitCount: 9,
  stands: [
    { code: "ZA-S1", visited: true },
    { code: "ZA-S2", visited: false },
  ],
  tickets: [{ number: 3, milestone: 9 }],
};

const SAVED_AT = new Date("2026-11-20T18:00:00.000Z");

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ now: SAVED_AT });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("PassportSnapshotSaver", () => {
  it("saves the passport in the phone after a load that worked", () => {
    render(<PassportSnapshotSaver passport={PASSPORT} visits={VISITS} />);

    expect(parseSnapshot(window.localStorage.getItem(PASSPORT_SNAPSHOT_KEY))).toEqual({
      savedAt: SAVED_AT.toISOString(),
      passport: PASSPORT,
      visits: VISITS,
    });
  });

  it("renders nothing visible", () => {
    const { container } = render(<PassportSnapshotSaver passport={PASSPORT} visits={VISITS} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("ClearPassportSnapshot (RF-18, RF-70)", () => {
  it("deletes the copy of a phone that is no longer the active device", () => {
    savePassportSnapshot({ passport: PASSPORT, visits: VISITS, now: SAVED_AT });

    render(<ClearPassportSnapshot />);

    expect(window.localStorage.getItem(PASSPORT_SNAPSHOT_KEY)).toBeNull();
  });
});

describe("OfflinePassport (item 3)", () => {
  // jsdom always reports a network; these tests are about the phone without one, except the last one.
  beforeEach(() => {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the PIN, the gamertag and the progress that were saved, with how old they are", () => {
    savePassportSnapshot({ passport: PASSPORT, visits: VISITS, now: new Date(SAVED_AT.getTime() - 5 * 60_000) });

    render(<OfflinePassport fallback={<p>no copy</p>} />);

    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("PlayerOne")).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.passport.progress.remaining(9))).toBeInTheDocument();
    expect(screen.getByText("ZA-S2")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Sin conexión. Datos de hace 5 min");
    expect(screen.queryByText("no copy")).not.toBeInTheDocument();
  });

  it("updates how old the data is while the page stays open", () => {
    savePassportSnapshot({ passport: PASSPORT, visits: VISITS, now: SAVED_AT });

    render(<OfflinePassport fallback={null} />);

    expect(screen.getByRole("status")).toHaveTextContent("Datos de hace un momento");

    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Datos de hace 2 min");
  });

  it("does not say Sin conexión about the data while the phone has a network", () => {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    savePassportSnapshot({ passport: PASSPORT, visits: VISITS, now: new Date(SAVED_AT.getTime() - 5 * 60_000) });

    render(<OfflinePassport fallback={null} />);

    expect(screen.getByRole("status")).toHaveTextContent("Datos guardados hace 5 min");
    expect(screen.getByRole("status")).not.toHaveTextContent("Sin conexión");
  });

  it("shows the fallback without a saved copy, and never the PIN", () => {
    render(<OfflinePassport fallback={<p>no copy</p>} />);

    expect(screen.getByText("no copy")).toBeInTheDocument();
    expect(screen.queryByText("12345")).not.toBeInTheDocument();
  });

  it("shows the fallback when the saved copy is broken", () => {
    window.localStorage.setItem(PASSPORT_SNAPSHOT_KEY, '{"pin":"12345"}');

    render(<OfflinePassport fallback={<p>no copy</p>} />);

    expect(screen.getByText("no copy")).toBeInTheDocument();
    expect(screen.queryByText("12345")).not.toBeInTheDocument();
  });
});
