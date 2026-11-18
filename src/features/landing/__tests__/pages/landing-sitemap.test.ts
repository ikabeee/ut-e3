import { buildFooterSitemap } from "@features/landing/pages/landing-sitemap";

function getLinks(isLandingOnly: boolean) {
  return buildFooterSitemap(isLandingOnly).flatMap((group) => group.links);
}

describe("buildFooterSitemap", () => {
  it("lists the sections of the landing, the public pages and the staff access", () => {
    const links = getLinks(false);
    const hrefOf = (label: string) => links.find((link) => link.label === label)?.href;

    expect(buildFooterSitemap(false).map((group) => group.label)).toEqual(["Evento", "Páginas", "Staff"]);
    expect(hrefOf("Juegos")).toBe("/#games");
    expect(hrefOf("Invitadas especiales")).toBe("/#guests");
    expect(hrefOf("Cronograma")).toBe("/#schedule");
    expect(hrefOf("Ubicación")).toBe("/#venue");
    expect(hrefOf("Catálogo de juegos")).toBe("/games");
    expect(hrefOf("Ganadores de la rifa")).toBe("/raffle");
    expect(hrefOf("Torneo de KOF")).toBe("/tournament");
    expect(hrefOf("Acceso del staff")).toBe("/login");
    expect(hrefOf("Panel de administración")).toBe("/admin");
  });

  it("holds only anchors of the same page, with no staff nor guests, while only the landing is published", () => {
    const groups = buildFooterSitemap(true);

    expect(groups.map((group) => group.label)).toEqual(["Evento"]);
    expect(getLinks(true).map((link) => link.href)).toEqual([
      "#games",
      "#event",
      "#sponsors",
      "#schedule",
      "#floor-plan",
      "#venue",
    ]);
  });

  it("points every anchor to a section that the landing has", () => {
    for (const link of getLinks(false).filter((item) => item.href.startsWith("/#"))) {
      expect(link.href.slice("/#".length)).toMatch(/^(games|event|guests|sponsors|schedule|floor-plan|venue)$/);
    }
  });
});
