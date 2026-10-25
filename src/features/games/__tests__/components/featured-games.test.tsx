import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { FeaturedGames } from "@features/games/components/featured-games";

const AUTOPLAY_MS = 6500;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const games = makeGames(4);

function currentTitle() {
  return screen.getByRole("heading", { level: 2 });
}

function getSlides() {
  return screen
    .getAllByRole("group", { hidden: true })
    .filter((group) => group.getAttribute("aria-roledescription") === "diapositiva");
}

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

function stubReducedMotion(isReduced: boolean) {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: isReduced && query === REDUCED_MOTION_QUERY,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

describe("FeaturedGames", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders a slide with the cover of every game", () => {
    render(<FeaturedGames games={games} />);

    const slides = getSlides();

    expect(slides).toHaveLength(games.length);
    games.forEach((game, index) => {
      expect(slides[index]).toHaveAccessibleName(game.name);
      expect(
        within(slides[index]).getByRole("img", { hidden: true, name: `Portada de ${game.name}` }),
      ).toBeInTheDocument();
    });
  });

  it("renders a thumbnail for every game and marks the first one as current", () => {
    render(<FeaturedGames games={games} />);

    games.forEach((game, index) => {
      const thumbnail = screen.getByRole("button", { name: game.name });

      expect(thumbnail).toHaveAttribute("aria-current", String(index === 0));
    });
  });

  it("shows the first game title and synopsis", () => {
    render(<FeaturedGames games={games} />);

    expect(currentTitle()).toHaveTextContent("Juego 01");
    expect(screen.getByText("Juego 01, juego de prueba.")).toBeInTheDocument();
  });

  it("moves to the next and previous game and wraps around at both ends", () => {
    render(<FeaturedGames games={games} />);

    fireEvent.click(screen.getByRole("button", { name: "Juego anterior" }));
    expect(currentTitle()).toHaveTextContent("Juego 04");

    fireEvent.click(screen.getByRole("button", { name: "Juego siguiente" }));
    expect(currentTitle()).toHaveTextContent("Juego 01");

    fireEvent.click(screen.getByRole("button", { name: "Juego siguiente" }));
    expect(currentTitle()).toHaveTextContent("Juego 02");
  });

  it("selects a game from its thumbnail", () => {
    render(<FeaturedGames games={games} />);

    fireEvent.click(screen.getByRole("button", { name: "Juego 03" }));

    expect(currentTitle()).toHaveTextContent("Juego 03");
    expect(screen.getByRole("button", { name: "Juego 03" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Juego 01" })).toHaveAttribute("aria-current", "false");
  });

  it("advances on its own after 6500 ms", () => {
    stubReducedMotion(false);
    render(<FeaturedGames games={games} />);

    advance(AUTOPLAY_MS + 100);

    expect(currentTitle()).toHaveTextContent("Juego 02");
  });

  it("does not advance on its own when the visitor prefers reduced motion", () => {
    stubReducedMotion(true);
    render(<FeaturedGames games={games} />);

    advance(AUTOPLAY_MS * 3);

    expect(currentTitle()).toHaveTextContent("Juego 01");
  });
});
