import { render, screen } from "@testing-library/react";
import type { EventSettings } from "@features/event-settings/lib/types";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
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

  it("points the call to action to Google Calendar for 20 Nov 2026 from 12:00 to 19:00 in Cancun", () => {
    renderLanding();

    const callToAction = screen.getByRole("link", { name: /Quiero participar/ });
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

    const callToAction = screen.getByRole("link", { name: /Quiero participar/ });
    const calendarUrl = new URL(callToAction.getAttribute("href") ?? "");

    expect(screen.getByRole("heading", { level: 1, name: "PIXEL & CODE" })).toBeInTheDocument();
    expect(calendarUrl.searchParams.get("text")).toBe("PIXEL & CODE · Showcase de videojuegos");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("PIXEL & CODE · Showcase de videojuegos");
  });

  it("places each game in the croquis at its zA-s stand code", () => {
    renderLanding();

    expect(screen.getByRole("button", { name: "Stand zA-s1, Juego 01" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stand zA-s9, Juego 09" })).toBeInTheDocument();
  });

  it("renders the marketplace slot inside the event section", () => {
    renderLanding();

    const eventSection = document.getElementById("event");

    expect(eventSection).toHaveTextContent("Registro de vendedores cerrado");
  });
});
