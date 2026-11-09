import { render, screen, within } from "@testing-library/react";
import type { EventSettings } from "@features/event-settings/lib/types";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { LandingView, landingPageMetadata } from "@features/landing/pages/landing-page";
import type { ScheduleItem } from "@features/schedule/lib/types";

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

const SECTION_ORDER = ["top", "event", "guests", "games", "schedule", "floor-plan", "venue"];

const games = makeGames(18);

function renderLanding() {
  return render(
    <LandingView
      settings={SETTINGS}
      games={games}
      scheduleItems={SCHEDULE}
      sponsors={[]}
      marketplace={<p>Registro de vendedores cerrado</p>}
    />,
  );
}

function isBefore(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("landingPageMetadata", () => {
  it("publishes the home metadata with the root canonical", () => {
    expect(landingPageMetadata.alternates).toEqual({ canonical: "/" });
  });

  it("uses the PIXEL & CODE title and description", () => {
    expect(landingPageMetadata.title).toEqual({ absolute: "PIXEL & CODE · Showcase de videojuegos" });
    expect(landingPageMetadata.description).toContain("PIXEL & CODE");
  });
});

describe("LandingView", () => {
  it("shows the venue in the Edificio B with its map region", () => {
    renderLanding();

    expect(screen.getByText("Edificio B · Lobby y áreas externas")).toBeInTheDocument();
    expect(screen.getByLabelText("Mapa de la ubicación del evento: Edificio B, UT Cancún")).toBeInTheDocument();
  });

  it("renders the sections in the landing order", () => {
    renderLanding();

    const sections = SECTION_ORDER.map((id) => document.getElementById(id));

    sections.forEach((section, index) => {
      const previous = index > 0 ? sections[index - 1] : null;

      expect(section).not.toBeNull();

      if (section && previous) {
        expect(isBefore(previous, section)).toBe(true);
      }
    });
  });

  it("links every navigation entry to a section of the page", () => {
    renderLanding();

    const navigation = screen.getByRole("navigation");
    const anchors = Array.from(navigation.querySelectorAll("a[href^='#']"));

    expect(anchors.length).toBeGreaterThan(1);
    anchors.forEach((anchor) => {
      const id = anchor.getAttribute("href")?.slice(1) ?? "";

      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  it("sends Juegos in the navbar to the games catalog", () => {
    renderLanding();

    expect(within(screen.getByRole("navigation")).getByRole("link", { name: "Juegos" })).toHaveAttribute(
      "href",
      "/games",
    );
  });

  it("sends Patrocinadores in the navbar to the sponsors page", () => {
    renderLanding();

    expect(within(screen.getByRole("navigation")).getByRole("link", { name: "Patrocinadores" })).toHaveAttribute(
      "href",
      "/sponsors",
    );
  });

  it("keeps the logo linked to the top of the landing", () => {
    renderLanding();

    expect(screen.getByRole("link", { name: "UTG, inicio" })).toHaveAttribute("href", "#top");
  });

  it("points the call to action to Google Calendar for 20 Nov 2026 from 12:00 to 19:00 in Cancun", () => {
    renderLanding();

    const callToAction = screen.getByRole("link", { name: /Agregar al calendario/ });
    const url = new URL(callToAction.getAttribute("href") ?? "");

    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261120T170000Z/20261121T000000Z");
  });

  it("shows the event date in the closing band and in the schedule heading", () => {
    renderLanding();

    expect(screen.getAllByText(/20\.11\.2026/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "20.11.26" })).toBeInTheDocument();
  });

  it("shows the KOF check-in and on-site signup ranges and the raffle times from the event settings", () => {
    renderLanding();

    expect(document.body).toHaveTextContent("11:00 a 12:00");
    expect(document.body).toHaveTextContent("12:00 a 12:45");
    expect(document.body).toHaveTextContent("18:00");
    expect(document.body).toHaveTextContent("17:00");
  });

  it("counts the games of the catalog in the JUEGA act", () => {
    renderLanding();

    expect(document.body).toHaveTextContent("18 juegos hechos por estudiantes");
  });

  it("names the page PIXEL & CODE in the title, the calendar event and the footer", () => {
    renderLanding();

    const callToAction = screen.getByRole("link", { name: /Agregar al calendario/ });
    const calendarUrl = new URL(callToAction.getAttribute("href") ?? "");

    expect(screen.getByRole("heading", { level: 1, name: "PIXEL & CODE" })).toBeInTheDocument();
    expect(calendarUrl.searchParams.get("text")).toBe("PIXEL & CODE · Showcase de videojuegos");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("PIXEL & CODE · Showcase de videojuegos");
  });

  it("places each game in the croquis at its ZA-S stand code", () => {
    renderLanding();

    expect(screen.getByRole("button", { name: "Stand ZA-S1, Juego 01" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stand ZA-S3, Juego 03" })).toBeInTheDocument();
  });

  it("renders the marketplace slot inside the event section", () => {
    renderLanding();

    const eventSection = document.getElementById("event");

    expect(eventSection).toHaveTextContent("Registro de vendedores cerrado");
  });
});

describe("LandingView with only the landing published", () => {
  function renderLandingOnly() {
    return render(
      <LandingView settings={SETTINGS} games={games} scheduleItems={SCHEDULE} sponsors={[]} isLandingOnly />,
    );
  }

  it("links every navigation entry to a section of the same page", () => {
    renderLandingOnly();

    const links = within(screen.getByRole("navigation")).getAllByRole("link");

    links.forEach((link) => expect(link.getAttribute("href")).toMatch(/^#/));
  });

  it("leaves the way home to the logo", () => {
    renderLandingOnly();

    expect(within(screen.getByRole("navigation")).queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
  });

  it("leaves out what needs the passport or is not announced yet: rating, marketplace and special guests", () => {
    renderLandingOnly();

    expect(document.getElementById("rate")).toBeNull();
    expect(document.getElementById("guests")).toBeNull();
    expect(screen.queryByText(LANDING_COPY.acts.marketplace.title)).not.toBeInTheDocument();
  });

  it("leaves out the passport registration, which is closed", () => {
    renderLandingOnly();

    expect(screen.queryByRole("link", { name: /crear mi pasaporte/i })).not.toBeInTheDocument();
  });

  it("does not link to any page other than the landing and outside sites", () => {
    renderLandingOnly();

    const internalLinks = Array.from(document.querySelectorAll("a[href^='/']")).map((link) =>
      link.getAttribute("href"),
    );

    expect(internalLinks).toEqual([]);
  });

  it("keeps the games of the coverflow without a link to their page", () => {
    renderLandingOnly();

    expect(screen.getByRole("link", { name: /Juego 01/ })).toHaveAttribute("href", "#games");
  });

  it("does not place the games in the croquis while their stands are provisional", () => {
    renderLandingOnly();

    expect(screen.queryByRole("button", { name: "Stand ZA-S1, Juego 01" })).not.toBeInTheDocument();
  });
});
