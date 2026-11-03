import { PASSPORT_SNAPSHOT_KEY, parseSnapshot } from "@features/visitors/lib/passport-snapshot";
import {
  clearPassportSnapshot,
  readRawPassportSnapshot,
  savePassportSnapshot,
} from "@features/visitors/lib/passport-snapshot-storage";

const INPUT = {
  passport: { gamertag: "PlayerOne", pin: "12345" },
  visits: { visitCount: 0, stands: [], tickets: [] },
  now: new Date("2026-11-20T18:00:00.000Z"),
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("the passport copy in the phone", () => {
  it("is saved in the localStorage of the phone and can be read back", () => {
    const snapshot = savePassportSnapshot(INPUT);

    expect(snapshot).toMatchObject({ savedAt: "2026-11-20T18:00:00.000Z" });
    expect(parseSnapshot(readRawPassportSnapshot())).toEqual(snapshot);
    expect(window.localStorage.getItem(PASSPORT_SNAPSHOT_KEY)).toContain("12345");
  });

  it("keeps only the last version: each load replaces the copy", () => {
    savePassportSnapshot(INPUT);
    savePassportSnapshot({ ...INPUT, passport: { gamertag: "PlayerOne", pin: "54321" } });

    expect(parseSnapshot(readRawPassportSnapshot())?.passport.pin).toBe("54321");
  });

  it("is deleted when the device is replaced", () => {
    savePassportSnapshot(INPUT);

    clearPassportSnapshot();

    expect(readRawPassportSnapshot()).toBeNull();
  });

  it("does not break the passport when the phone refuses to store (private window, full storage)", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(savePassportSnapshot(INPUT)).toBeNull();
  });

  it("does not break when the storage cannot be read or cleared", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(readRawPassportSnapshot()).toBeNull();
    expect(() => clearPassportSnapshot()).not.toThrow();
  });
});
