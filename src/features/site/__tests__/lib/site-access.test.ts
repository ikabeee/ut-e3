import { decideSiteAccess } from "@features/site/lib/site-access";

describe("decideSiteAccess in landing mode", () => {
  it.each(["/", "/privacy", "/api/health", "/manifest.webmanifest", "/icon.svg"])("serves %s", (pathname) => {
    expect(decideSiteAccess("landing", { method: "GET", pathname })).toBe("allow");
  });

  it("answers HEAD like GET", () => {
    expect(decideSiteAccess("landing", { method: "HEAD", pathname: "/" })).toBe("allow");
  });

  it.each(["/games/abby-s-tower.jpg", "/sponsors/bonavida.svg", "/media/hero-loop.mp4", "/icons/icon-192.png"])(
    "serves the public file %s",
    (pathname) => {
      expect(decideSiteAccess("landing", { method: "GET", pathname })).toBe("allow");
    },
  );

  it.each([
    "/games",
    "/games/abby-s-tower",
    "/sponsors",
    "/register",
    "/passport",
    "/passport/claim/token",
    "/login",
    "/admin",
    "/admin/kof",
    "/stand/kiosk",
    "/support/recovery",
    "/raffle/live",
    "/tournament",
    "/showcase",
    "/offline",
  ])("sends the page %s back to the landing", (pathname) => {
    expect(decideSiteAccess("landing", { method: "GET", pathname })).toBe("redirectHome");
  });

  it.each(["/api/raffle", "/api/games/abby-s-tower/itch", "/api/tournament/public", "/api/pwa/precache"])(
    "answers the endpoint %s as not found",
    (pathname) => {
      expect(decideSiteAccess("landing", { method: "GET", pathname })).toBe("notFound");
    },
  );

  it.each([
    ["POST", "/"],
    ["POST", "/register"],
    ["PUT", "/api/health"],
    ["DELETE", "/admin"],
  ])("refuses %s %s, which is how a Server Action or a form would run", (method, pathname) => {
    expect(decideSiteAccess("landing", { method, pathname })).toBe("methodNotAllowed");
  });

  it.each(["/admin.rsc", "/register.rsc", "/games.rsc", "/passport.json", "/games/x.php"])(
    "does not take %s for a public file, since its extension is not one the landing serves",
    (pathname) => {
      expect(decideSiteAccess("landing", { method: "GET", pathname })).toBe("redirectHome");
    },
  );

  it("does not let a file name open a page outside the public folders", () => {
    expect(decideSiteAccess("landing", { method: "GET", pathname: "/admin/report.csv" })).toBe("redirectHome");
    expect(decideSiteAccess("landing", { method: "GET", pathname: "/api/raffle.json" })).toBe("notFound");
  });
});

describe("decideSiteAccess in full mode", () => {
  it.each([
    ["GET", "/passport"],
    ["POST", "/register"],
    ["GET", "/api/raffle"],
  ])("lets %s %s through", (method, pathname) => {
    expect(decideSiteAccess("full", { method, pathname })).toBe("allow");
  });
});
