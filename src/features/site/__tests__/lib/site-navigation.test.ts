import { getCurrentNavHref, getSiteNavigation, isSiteNavShown } from "@features/site/lib/site-navigation";

describe("isSiteNavShown", () => {
  it.each([
    "/",
    "/games",
    "/games/abby-s-tower",
    "/sponsors",
    "/showcase",
    "/raffle",
    "/tournament",
    "/floor-plan",
    "/passport",
    "/passport/recover",
    "/register",
    "/privacy",
    "/offline",
  ])("shows the navbar on the public page %s", (pathname) => {
    expect(isSiteNavShown(pathname)).toBe(true);
  });

  it.each([
    "/admin",
    "/admin/kof",
    "/admin/raffle",
    "/stand/kiosk",
    "/stand/team",
    "/support/recovery",
    "/login",
    "/activate/invitation-token",
    "/raffle/live",
  ])("hides the navbar on the staff or projection screen %s", (pathname) => {
    expect(isSiteNavShown(pathname)).toBe(false);
  });

  it("hides a whole area, not every path that starts with the same letters", () => {
    expect(isSiteNavShown("/standings")).toBe(true);
    expect(isSiteNavShown("/raffle/livestream")).toBe(true);
  });
});

describe("getSiteNavigation", () => {
  it("lists the six sections of the app and the passport as the call to action", () => {
    const navigation = getSiteNavigation(false);

    expect(navigation.homeHref).toBe("/");
    expect(navigation.links).toEqual([
      { href: "/", label: "Inicio" },
      { href: "/games", label: "Juegos" },
      { href: "/floor-plan", label: "Croquis" },
      { href: "/sponsors", label: "Patrocinadores" },
      { href: "/raffle", label: "Rifa" },
      { href: "/tournament", label: "Torneo" },
    ]);
    expect(navigation.cta).toEqual({ href: "/passport", label: "Mi pasaporte" });
  });

  it("keeps only the anchors of the landing and no call to action while only the landing is published", () => {
    const navigation = getSiteNavigation(true);

    expect(navigation.homeHref).toBe("/#top");
    expect(navigation.links).toEqual([
      { href: "/#games", label: "Juegos" },
      { href: "/#sponsors", label: "Patrocinadores" },
      { href: "/#floor-plan", label: "Croquis" },
    ]);
    expect(navigation.cta).toBeUndefined();
  });
});

describe("getCurrentNavHref", () => {
  const hrefs = ["/", "/games", "/floor-plan", "/sponsors", "/raffle", "/tournament", "/passport"];

  it.each([
    ["/", "/"],
    ["/games", "/games"],
    ["/games/abby-s-tower", "/games"],
    ["/floor-plan", "/floor-plan"],
    ["/sponsors", "/sponsors"],
    ["/raffle", "/raffle"],
    ["/tournament", "/tournament"],
    ["/passport", "/passport"],
  ])("marks %s as the page of %s", (pathname, href) => {
    expect(getCurrentNavHref(pathname, hrefs)).toBe(href);
  });

  it("marks nothing on a page that is not in the navbar", () => {
    expect(getCurrentNavHref("/privacy", hrefs)).toBeUndefined();
  });

  it("never marks an anchor of the landing as the current page", () => {
    expect(getCurrentNavHref("/", ["/#floor-plan"])).toBeUndefined();
  });
});
