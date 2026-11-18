import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { EventFlyers } from "@features/landing/components/event-flyers";
import { EVENT_FLYERS } from "@features/landing/lib/event-flyers";

describe("EventFlyers", () => {
  it("shows the fair and the tournament flyers with Spanish alt text", () => {
    render(<EventFlyers />);

    const fair = screen.getByRole("img", { name: /Cartel de la feria de exhibición de videojuegos/ });
    const tournament = screen.getByRole("img", { name: /Cartel del torneo de videojuegos/ });

    expect(fair.getAttribute("src")).toContain("fair-flyer.svg");
    expect(tournament.getAttribute("src")).toContain("tournament-flyer.svg");
  });

  it("loads the flyers lazily, with no preload", () => {
    render(<EventFlyers />);

    for (const flyer of screen.getAllByRole("img")) {
      expect(flyer).toHaveAttribute("loading", "lazy");
      expect(flyer).not.toHaveAttribute("fetchpriority", "high");
    }
  });

  it("is the section of the flyers, with its own heading", () => {
    const { container } = render(<EventFlyers />);

    expect(container.querySelector("#flyers")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Carteles del evento" })).toBeInTheDocument();
  });

  it("points to files of public/media/flyers, a folder the kill switch serves", () => {
    for (const flyer of EVENT_FLYERS) {
      expect(flyer.src.startsWith("/media/flyers/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", flyer.src))).toBe(true);
    }
  });
});
