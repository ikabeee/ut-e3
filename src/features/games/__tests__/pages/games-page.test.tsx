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
  it("titles the page with a hidden h1 and shows every game of the catalog", () => {
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Catálogo de juegos" })).toHaveClass("sr-only");
    expect(gridNames()).toHaveLength(6);
  });

  it("leaves only the carousel and the covers: no description, search or counter (S24)", () => {
    renderView();

    expect(screen.queryByText(/Explora los videojuegos del showcase/)).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/ de 6 juegos/)).not.toBeInTheDocument();
  });

  it("opens with the featured games carousel on the first game", () => {
    renderView();

    const featured = within(screen.getByRole("region", { name: "Juegos del showcase" }));

    expect(featured.getByRole("heading", { level: 2 })).toHaveTextContent("Juego 01");
  });

  it("renders no navbar of its own: the root layout mounts the site navbar", () => {
    renderView();

    expect(screen.queryByRole("navigation", { name: "Principal" })).not.toBeInTheDocument();
  });

  it("filters the catalog by the genre of the URL", () => {
    renderView("?genre=puzzle");

    expect(gridNames()).toEqual(["Juego 02", "Juego 05"]);
    expect(screen.getByRole("button", { name: /Puzle/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters the covers by the q search param, ignoring case and accents", () => {
    renderView("?q=ACCION");

    expect(gridNames()).toEqual(["Juego 01", "Juego 04"]);
  });

  it("applies the genre and q together", () => {
    renderView("?genre=action&q=juego 04");

    expect(gridNames()).toEqual(["Juego 04"]);
  });

  it("shows the empty state with a way back when q matches nothing", () => {
    renderView("?q=zzz");

    expect(screen.getByText("Ningún juego coincide con tu búsqueda.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver todos los juegos" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Todos los juegos" })).not.toBeInTheDocument();
  });

  it("treats a blank q as no search", () => {
    renderView("?q=%20%20");

    expect(gridNames()).toHaveLength(6);
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).not.toBeInTheDocument();
  });
});

function carouselThumbnails() {
  const carousel = within(screen.getByRole("region", { name: "Juegos del showcase" }));

  return carousel.getAllByRole("button", { name: /^Juego \d+$/ }).map((button) => button.getAttribute("aria-label"));
}

function genreTiles() {
  const shelves = within(screen.getByRole("region", { name: "Géneros" }));

  return shelves.getAllByRole("button", { name: /juegos?$/ }).map((tile) => tile.textContent);
}

describe("GamesView with q (S39)", () => {
  it("shows only the matching games in the carousel, the covers and the genre shelves", () => {
    renderView("?q=accion");

    expect(carouselThumbnails()).toEqual(["Juego 01", "Juego 04"]);
    expect(gridNames()).toEqual(["Juego 01", "Juego 04"]);
    expect(genreTiles()).toEqual([expect.stringMatching(/Acción.*2 juegos/)]);
  });

  it("counts a genre by its matching games only", () => {
    renderView("?q=juego 02");

    expect(carouselThumbnails()).toEqual(["Juego 02"]);
    expect(genreTiles()).toEqual([expect.stringMatching(/Puzle.*1 juego$/)]);
  });

  it("shows the empty state with no carousel and no genre shelves when nothing matches", () => {
    renderView("?q=zzz");

    expect(screen.getByText("Ningún juego coincide con tu búsqueda.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Juegos del showcase" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Géneros" })).not.toBeInTheDocument();
  });

  it("shows the whole catalog in the carousel and the shelves without q", () => {
    renderView();

    expect(carouselThumbnails()).toHaveLength(6);
    expect(genreTiles()).toHaveLength(3);
  });
});

describe("gamesPageMetadata", () => {
  it("has its own title, description and canonical URL", () => {
    expect(gamesPageMetadata.title).toBe("Catálogo de juegos");
    expect(gamesPageMetadata.description).toEqual(expect.any(String));
    expect(gamesPageMetadata.alternates?.canonical).toBe("/games");
  });
});
