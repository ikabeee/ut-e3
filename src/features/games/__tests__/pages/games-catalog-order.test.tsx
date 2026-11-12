import { render, screen, within } from "@testing-library/react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GamesView } from "@features/games/pages/games-page";

const games = makeGames(6);

function renderCatalog() {
  render(
    <SearchParamsContext.Provider value={new URLSearchParams("")}>
      <GamesView games={games} />
    </SearchParamsContext.Provider>,
  );
}

// On phones the hero fills most of the first screen, so whatever comes after it in the DOM is off-screen.
// jsdom has no viewport: DOM order is the observable rule for "visible on the first screen".
function appearsBefore(first: Node, second: Node): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("GamesView catalog order", () => {
  it("renders the catalog title and the search before the featured hero", () => {
    renderCatalog();

    const title = screen.getByRole("heading", { level: 1, name: "Catálogo de juegos" });
    const search = screen.getByRole("searchbox", { name: "Buscar juegos" });
    const hero = screen.getByRole("region", { name: "Juegos del showcase" });

    expect(appearsBefore(title, hero)).toBe(true);
    expect(appearsBefore(search, hero)).toBe(true);
  });

  it("keeps the featured hero and every game of the catalog on the page", () => {
    renderCatalog();

    expect(screen.getByRole("region", { name: "Juegos del showcase" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Todos los juegos" })).getAllByRole("heading", { level: 3 }),
    ).toHaveLength(6);
  });
});
