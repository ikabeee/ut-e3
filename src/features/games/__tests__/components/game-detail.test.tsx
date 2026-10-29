import { render, screen, within } from "@testing-library/react";
import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { GameDetail } from "@features/games/components/game-detail";
import type { GameImage } from "@features/games/lib/types";

const cover: GameImage = { path: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: 2, isCover: true };

const pits: GameImage = { path: "/games/ruta-9-pits.jpg", alt: "Ruta 9: pits", position: 1, isCover: false };

const game = makeGame({
  id: "ruta-9",
  name: "Ruta 9",
  synopsis: "Carreras arcade por la costa de Quintana Roo.",
  genre: { id: "racing", name: "Carreras", slug: "racing" },
  stand: { zone: "A", number: 3 },
  images: [pits, cover],
});

const relatedGames = [makeGame({ id: "cenote", name: "Cenote" }), makeGame({ id: "eco-nulo", name: "Eco Nulo" })];

const LINKS = {
  catalog: "/#games",
  floorPlan: "/#floor-plan-ZA-S3",
  calendar: "https://calendar.google.com/calendar/render?action=TEMPLATE",
};

function renderDetail(related = relatedGames) {
  render(
    <GameDetail
      game={game}
      itchLink={<p>itch slot</p>}
      event={{ dateLabel: "20.11.2026", hoursLabel: "12:00 a 19:00" }}
      links={LINKS}
      relatedGames={related}
    />,
  );
}

function definitionOf(container: HTMLElement, term: string) {
  return within(container).getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

describe("GameDetail", () => {
  it("heads the page with the name, the genre and the short stand code", () => {
    renderDetail();

    expect(screen.getByRole("heading", { level: 1, name: "Ruta 9" })).toBeInTheDocument();
    expect(screen.getByText("Carreras · ZA-S3")).toBeInTheDocument();
  });

  it("links back to every game", () => {
    renderDetail();

    expect(screen.getByRole("link", { name: "Todos los juegos" })).toHaveAttribute("href", "/#games");
  });

  it("shows the synopsis as the lead and the genre as a tag", () => {
    renderDetail();

    expect(screen.getByText("Carreras arcade por la costa de Quintana Roo.")).toBeInTheDocument();
    expect(definitionOf(screen.getByLabelText("Etiquetas"), "Género")).toBe("Carreras");
  });

  it("links the genre tag to the catalog filtered by that genre", () => {
    renderDetail();

    expect(within(screen.getByLabelText("Etiquetas")).getByRole("link", { name: "Carreras" })).toHaveAttribute(
      "href",
      "/games?genre=racing",
    );
  });

  it("opens the gallery on the cover", () => {
    renderDetail();

    const gallery = screen.getByRole("region", { name: "Galería" });

    expect(within(gallery).getByRole("img")).toHaveAttribute("alt", "Portada de Ruta 9");
  });

  it("says where to play it: stand, zone, event date and hours", () => {
    renderDetail();

    const where = screen.getByRole("region", { name: "Dónde jugarlo" });

    expect(definitionOf(where, "Stand")).toBe("ZA-S3");
    expect(definitionOf(where, "Zona")).toBe("A");
    expect(definitionOf(where, "Fecha")).toBe("20.11.2026");
    expect(definitionOf(where, "Horario")).toBe("12:00 a 19:00");
  });

  it("puts the cover, the itch.io slot, the floor plan and calendar links and the facts in the sidebar", () => {
    renderDetail();

    const sidebar = screen.getByRole("complementary", { name: "Ficha de Ruta 9" });
    const attend = within(sidebar).getByRole("link", { name: /Quiero asistir/ });

    expect(within(sidebar).getByRole("img", { name: "Portada de Ruta 9" })).toBeInTheDocument();
    expect(within(sidebar).getByText("itch slot")).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: /Ver en el croquis/ })).toHaveAttribute("href", LINKS.floorPlan);
    expect(attend).toHaveAttribute("href", LINKS.calendar);
    expect(attend).toHaveAttribute("target", "_blank");
    expect(attend).toHaveAttribute("rel", "noopener noreferrer");
    expect(definitionOf(sidebar, "Género")).toBe("Carreras");
    expect(definitionOf(sidebar, "Stand")).toBe("ZA-S3");
    expect(definitionOf(sidebar, "Evento")).toBe("20.11.2026");
  });

  it("shows only the short stand code", () => {
    renderDetail();

    expect(document.body.textContent).not.toMatch(/ZA-S3-E/);
  });

  it("lists more games linking to their pages, and every game", () => {
    renderDetail();

    const more = screen.getByRole("region", { name: "Más juegos" });

    expect(within(more).getByRole("link", { name: /Cenote/ })).toHaveAttribute("href", "/games/cenote");
    expect(within(more).getByRole("link", { name: /Eco Nulo/ })).toHaveAttribute("href", "/games/eco-nulo");
    expect(within(more).getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/#games");
  });

  it("leaves out the more games row when there is no other game", () => {
    renderDetail([]);

    expect(screen.queryByRole("region", { name: "Más juegos" })).not.toBeInTheDocument();
  });
});
