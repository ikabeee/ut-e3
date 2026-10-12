import { isNavLinkActive, NAV_LINKS, SECTION_LINKS } from "@features/site/lib/navigation";

describe("site navigation", () => {
  it("builds the sections from the routes declared by each feature", () => {
    expect(SECTION_LINKS.map((link) => [link.label, link.href])).toEqual([
      ["Juegos", "/games"],
      ["Croquis", "/floor-plan"],
      ["Mi QR", "/passport"],
    ]);
    expect(NAV_LINKS[0]).toEqual({ href: "/", label: "Inicio" });
  });

  it("marks a section as active on its own pages and never the home link", () => {
    const [home, games] = NAV_LINKS;

    expect(isNavLinkActive(games, "/games/ruta-9")).toBe(true);
    expect(isNavLinkActive(games, "/floor-plan")).toBe(false);
    expect(isNavLinkActive(home, "/")).toBe(false);
  });
});
