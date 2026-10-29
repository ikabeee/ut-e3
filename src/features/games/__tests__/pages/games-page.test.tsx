import { render, screen, within } from "@testing-library/react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GamesView, gamesPageMetadata } from "@features/games/pages/games-page";

const games = makeGames(6);

// The App Router provides the search params through this context; jest.mock is not allowed in this repository.
function renderView(search = "") {
  render(
    <SearchParamsContext.Provider value={new URLSearchParams(search)}>
      <GamesView games={games} />
    </SearchParamsContext.Provider>,
  );
}

function gridNames() {
  return within(screen.getByRole("list", { name: "Todos los juegos" }))
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

describe("GamesView", () => {
  it("titles the page and shows every game of the catalog", () => {
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Catálogo de juegos" })).toBeInTheDocument();
    expect(gridNames()).toHaveLength(6);
  });

  it("opens with the featured games carousel on the first game", () => {
    renderView();

    const featured = within(screen.getByRole("region", { name: "Juegos del showcase" }));

    expect(featured.getByRole("heading", { level: 2 })).toHaveTextContent("Juego 01");
  });

  it("shows the site navbar with Inicio and Juegos", () => {
    renderView();

    const navigation = within(screen.getByRole("navigation", { name: "Principal" }));

    expect(navigation.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(navigation.getByRole("link", { name: "Juegos" })).toHaveAttribute("href", "/games");
  });

  it("filters the catalog by the genre of the URL", () => {
    renderView("?genre=puzzle");

    expect(gridNames()).toEqual(["Juego 02", "Juego 05"]);
    expect(screen.getByRole("button", { name: /Puzle/ })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("gamesPageMetadata", () => {
  it("has its own title, description and canonical URL", () => {
    expect(gamesPageMetadata.title).toBe("Catálogo de juegos");
    expect(gamesPageMetadata.description).toEqual(expect.any(String));
    expect(gamesPageMetadata.alternates?.canonical).toBe("/games");
  });
});
