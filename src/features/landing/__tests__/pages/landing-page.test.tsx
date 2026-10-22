import { render, screen } from "@testing-library/react";
import { LandingPage, landingPageMetadata } from "@features/landing/pages/landing-page";

describe("LandingPage", () => {
  it("publishes the home metadata with the root canonical", () => {
    expect(landingPageMetadata.alternates).toEqual({ canonical: "/" });
  });

  it("renders every section in order inside the light theme scope", () => {
    const { container } = render(<LandingPage />);

    const scope = container.querySelector("[data-theme='light']");
    const ids = Array.from(scope?.querySelectorAll("main > section") ?? []).map((section) => section.id);

    expect(scope).toHaveClass("light");
    expect(ids).toEqual(["hero", "groups", "intro", "games", "dynamics", "program"]);
  });

  it("wires the static data into the sections", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Videojuegos" })).toBeInTheDocument();
    expect(screen.getByText("IDYGS 101")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver juegos/i })).toHaveAttribute("href", "/#games");
    expect(screen.getByText("20 Nov 2026 • UT Cancún | Entrada libre")).toBeInTheDocument();
    expect(screen.getByText("Noviembre 20, 2026")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("1/18")).toBeInTheDocument();
    expect(screen.getByText("Quienes prueben los 18 juegos")).toBeInTheDocument();
  });

  it("publishes the schema.org Event JSON-LD", () => {
    const { container } = render(<LandingPage />);

    const json = JSON.parse(container.querySelector("script[type='application/ld+json']")?.textContent ?? "{}");

    expect(json["@type"]).toBe("Event");
  });
});
