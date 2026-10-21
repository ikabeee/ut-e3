import { screen } from "@testing-library/react";
import { renderWithGames } from "@features/games/__tests__/render-with-games";
import { LandingPage, landingPageMetadata } from "@features/landing/pages/landing-page";

jest.mock("@features/games/lib/server/games-queries", () => ({
  listGames: jest.fn(async () => (await import("@features/games/__tests__/game-fixtures")).GAME_FIXTURES),
}));
jest.mock("@features/games/lib/server/games-prefetch", () => ({
  getGamesHydrationState: jest.fn(async () => ({ mutations: [], queries: [] })),
}));
// Es un Server Component asíncrono: el renderizador de pruebas del navegador no lo resuelve.
jest.mock("@shared/components/query-hydration-boundary", () => ({
  QueryHydrationBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LandingPage", () => {
  it("publishes the home metadata with the root canonical", () => {
    expect(landingPageMetadata.alternates).toEqual({ canonical: "/" });
  });

  it("renders every section in order inside the light theme scope", async () => {
    const { container } = renderWithGames(await LandingPage());

    const scope = container.querySelector("[data-theme='light']");
    const ids = Array.from(scope?.querySelectorAll("main > section") ?? []).map((section) => section.id);

    expect(scope).toHaveClass("light");
    expect(ids).toEqual(["hero", "groups", "intro", "games", "dynamics", "program"]);
  });

  it("wires the real data into the sections", async () => {
    renderWithGames(await LandingPage());

    expect(screen.getByRole("heading", { level: 1, name: "Videojuegos" })).toBeInTheDocument();
    expect(screen.getByText("IDYGS 101")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver juegos/i })).toHaveAttribute("href", "/games");
  });

  it("publishes the schema.org Event JSON-LD", async () => {
    const { container } = renderWithGames(await LandingPage());

    const json = JSON.parse(container.querySelector("script[type='application/ld+json']")?.textContent ?? "{}");

    expect(json["@type"]).toBe("Event");
  });
});
