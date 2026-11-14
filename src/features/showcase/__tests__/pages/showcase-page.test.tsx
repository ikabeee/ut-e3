import { render, screen, within } from "@testing-library/react";
import type { EventSettings } from "@features/event-settings/lib/types";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { ShowcaseView, showcasePageMetadata } from "@features/showcase/pages/showcase-page";
import { SPONSORS } from "@features/sponsors/__tests__/components/sponsor-test-data";

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

const SCHEDULE: ScheduleItem[] = [
  {
    id: "raffle",
    title: "Rifa",
    description: "Sorteo de los boletos ganados con el pasaporte.",
    startsAt: "2026-11-20T23:00:00.000Z",
    endsAt: "2026-11-21T00:00:00.000Z",
    zone: "stage",
  },
];

function renderShowcase() {
  return render(<ShowcaseView settings={SETTINGS} games={makeGames(3)} scheduleItems={SCHEDULE} sponsors={SPONSORS} />);
}

describe("ShowcaseView", () => {
  it("titles the page with the event name", () => {
    renderShowcase();

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("PIXEL & CODE");
  });

  it("renders no navbar of its own: the root layout mounts the site navbar", () => {
    renderShowcase();

    expect(screen.queryByRole("navigation", { name: "Principal" })).not.toBeInTheDocument();
  });

  it("offers the passport and shows the date and the venue of the event", () => {
    renderShowcase();

    expect(screen.getByRole("link", { name: /Crear mi pasaporte/ })).toHaveAttribute("href", "/register");
    expect(screen.getByText(/2026.*UT Cancún/)).toBeInTheDocument();
  });

  it("shows the games, the schedule and the sponsors of the event", () => {
    renderShowcase();

    expect(screen.getByRole("region", { name: "Juegos del showcase" })).toBeInTheDocument();
    expect(screen.getByText("Rifa")).toBeInTheDocument();
    expect(screen.getByText("Pixel Forge")).toBeInTheDocument();
  });

  it("shows the sponsors as numbered raffle tickets like the landing", () => {
    renderShowcase();

    const sponsors = screen.getByRole("region", { name: "Patrocinadores" });

    expect(within(sponsors).getByText("Gracias a quienes hacen posible el evento.")).toBeInTheDocument();
    expect(within(sponsors).getByText("Nº 003")).toBeInTheDocument();
    expect(within(sponsors).getByRole("img", { name: "Code Lab" })).toBeInTheDocument();
  });

  it("shows the talks, the floor plan and the venue like the landing", () => {
    renderShowcase();

    expect(screen.getByRole("heading", { level: 2, name: "Invitadas especiales" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Croquis" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Ubicación" })).toBeInTheDocument();
    expect(screen.getByText(/Carretera Cancún–Aeropuerto, Km 11.5/)).toBeInTheDocument();
    expect(screen.getByText("Edificio B · Lobby y áreas externas")).toBeInTheDocument();
    expect(screen.getByLabelText("Mapa de la ubicación del evento: Edificio B, UT Cancún")).toBeInTheDocument();
  });

  it("has no contact form, quotes or studio disciplines", () => {
    renderShowcase();

    expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Lo que dicen|Qué hacemos/)).not.toBeInTheDocument();
  });

  it("points its canonical URL to /showcase", () => {
    expect(showcasePageMetadata.alternates?.canonical).toBe("/showcase");
  });
});
