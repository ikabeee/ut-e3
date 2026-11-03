import { isRegistrablePath, PRECACHE_INTERVAL_MS, shouldPrecache } from "@features/pwa/lib/registration-scope";

describe("isRegistrablePath", () => {
  it.each([
    "/",
    "/games",
    "/games/ruta-9",
    "/sponsors",
    "/privacy",
    "/register",
    "/passport",
    "/passport/claim/x",
    "/offline",
  ])("registers the worker from %s, a page of the public or visitor flow", (pathname) => {
    expect(isRegistrablePath(pathname)).toBe(true);
  });

  it.each([
    "/admin",
    "/admin/kof",
    "/stand/kiosk",
    "/stand/team",
    "/support/recovery",
    "/tournament",
    "/login",
    "/activate/x",
  ])("does not register it from %s", (pathname) => {
    expect(isRegistrablePath(pathname)).toBe(false);
  });

  it("does not match a path that only starts like a public one", () => {
    expect(isRegistrablePath("/gamesx")).toBe(false);
    expect(isRegistrablePath("/passports")).toBe(false);
  });
});

describe("shouldPrecache", () => {
  const NOW = 1_800_000_000_000;

  it("asks the first time", () => {
    expect(shouldPrecache({ lastAt: null, now: NOW })).toBe(true);
  });

  it("does not ask again within six hours", () => {
    expect(shouldPrecache({ lastAt: NOW - PRECACHE_INTERVAL_MS + 1, now: NOW })).toBe(false);
  });

  it("asks again after six hours, and when the clock went back", () => {
    expect(shouldPrecache({ lastAt: NOW - PRECACHE_INTERVAL_MS, now: NOW })).toBe(true);
    expect(shouldPrecache({ lastAt: NOW + 1000, now: NOW })).toBe(true);
  });
});
