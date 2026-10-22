import { render, screen } from "@testing-library/react";
import { LandingHero } from "@features/landing/components/landing-hero";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const props = {
  dateLabel: "20 Nov 2026",
  venueLabel: "UT Cancún",
  admissionLabel: "Entrada libre",
  gamesHref: "/games",
  calendarUrl: "https://calendar.example/event",
};

describe("LandingHero", () => {
  it("links to the games catalog internally", () => {
    render(<LandingHero {...props} />);

    expect(screen.getByRole("link", { name: /ver juegos/i })).toHaveAttribute("href", "/games");
  });

  it("opens the calendar link in a new tab safely", () => {
    render(<LandingHero {...props} />);

    const link = screen.getByRole("link", { name: /agendar fecha/i });
    expect(link).toHaveAttribute("href", props.calendarUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows the event data it receives", () => {
    render(<LandingHero {...props} />);

    expect(screen.getByText("20 Nov 2026 • UT Cancún | Entrada libre")).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.hero.division)).toBeInTheDocument();
  });
});

describe("LandingHero image", () => {
  it("renders the hero image with its alt text and a local source", () => {
    render(<LandingHero {...props} />);

    expect(screen.getByRole("img", { name: /control de videojuegos/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Videojuegos" })).toBeInTheDocument();
  });
});
