import { render } from "@testing-library/react";
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

  it("renders the section slots in order inside the light theme scope", async () => {
    const { container } = render(await LandingPage());

    const scope = container.querySelector("[data-theme='light']");
    const ids = Array.from(scope?.querySelectorAll("main > section") ?? []).map((section) => section.id);

    expect(scope).toHaveClass("light");
    expect(ids).toEqual(["hero", "groups", "intro", "games", "dynamics", "program"]);
  });

  it("keeps the schema.org Event JSON-LD of the old home", async () => {
    const { container } = render(await LandingPage());

    const json = JSON.parse(container.querySelector("script[type='application/ld+json']")?.textContent ?? "{}");

    expect(json["@type"]).toBe("Event");
  });
});
