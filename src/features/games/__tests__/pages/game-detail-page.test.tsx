import { render, screen, within } from "@testing-library/react";
import type { EventSettings } from "@features/event-settings/lib/types";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GameDetailView } from "@features/games/pages/game-detail-page";
import { buildEventCalendarUrl } from "@features/landing/lib/calendar-link";

const SETTINGS: EventSettings = {
  eventStartsAt: "2026-11-20T17:00:00.000Z",
  eventEndsAt: "2026-11-21T00:00:00.000Z",
  registrationOpensAt: "2026-11-13T05:00:00.000Z",
  kofRegistrationOpensAt: "2026-11-13T05:00:00.000Z",
  kofCheckInStartsAt: "2026-11-20T16:00:00.000Z",
  kofCheckInEndsAt: "2026-11-20T17:00:00.000Z",
  kofOnsiteSignupStartsAt: "2026-11-20T17:00:00.000Z",
  kofOnsiteSignupEndsAt: "2026-11-20T17:45:00.000Z",
  kofBracketGeneratesAt: "2026-11-20T18:00:00.000Z",
  marketplaceClosesAt: "2026-11-11T04:59:00.000Z",
  marketplaceFormUrl: null,
  itchOpensAt: "2026-11-20T21:30:00.000Z",
  checkInCutoffAt: "2026-11-20T22:00:00.000Z",
  raffleStartsAt: "2026-11-20T23:00:00.000Z",
  publicBracketEnabled: true,
};

const games = makeGames(9);

const current = games[3];

function renderView() {
  render(<GameDetailView game={current} games={games} settings={SETTINGS} itchLink={null} />);
}

function definitionOf(container: HTMLElement, term: string) {
  return within(container).getByText(term, { selector: "dt" }).nextElementSibling?.textContent;
}

describe("GameDetailView", () => {
  it("dates the event and its hours in Cancun from the event settings", () => {
    renderView();

    const where = screen.getByRole("region", { name: "Dónde jugarlo" });

    expect(definitionOf(where, "Fecha")).toBe("20.11.2026");
    expect(definitionOf(where, "Horario")).toBe("12:00 a 19:00");
  });

  it("links the stand to its place on the landing floor plan", () => {
    renderView();

    expect(screen.getByRole("link", { name: /Ver en el croquis/ })).toHaveAttribute("href", "/#floor-plan-ZA-S4");
  });

  it("adds the event to the calendar with the same event the landing uses", () => {
    renderView();

    const expected = buildEventCalendarUrl({ startsAt: SETTINGS.eventStartsAt, endsAt: SETTINGS.eventEndsAt });

    expect(screen.getByRole("link", { name: /Quiero asistir/ })).toHaveAttribute("href", expected);
  });

  it("sends Todos los juegos and Ver todos to the games catalog", () => {
    renderView();

    expect(screen.getByRole("link", { name: "Todos los juegos" })).toHaveAttribute("href", "/games");
    expect(screen.getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/games");
  });

  it("suggests other games, the same genre first", () => {
    renderView();

    const more = screen.getByRole("region", { name: "Más juegos" });

    const hrefs = within(more)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/games/"));

    expect(hrefs).toEqual([
      "/games/juego-07",
      "/games/juego-01",
      "/games/juego-05",
      "/games/juego-06",
      "/games/juego-08",
    ]);
  });
});
