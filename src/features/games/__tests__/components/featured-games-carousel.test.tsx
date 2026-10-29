import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";

const AUTOPLAY_MS = 6500;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const games = makeGames(4);

function currentTitle() {
  return screen.getByRole("heading", { level: 2 });
}

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

function pressArrow(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function stubReducedMotion() {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query === REDUCED_MOTION_QUERY,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

describe("FeaturedGamesCarousel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders nothing when there are no games", () => {
    const { container } = render(<FeaturedGamesCarousel games={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("starts on the first game, its title linked to its page, with its synopsis", () => {
    render(<FeaturedGamesCarousel games={games} />);

    expect(screen.getByRole("region", { name: "Juegos del showcase" })).toHaveAttribute(
      "aria-roledescription",
      "carrusel",
    );
    expect(currentTitle()).toHaveTextContent("Juego 01");
    expect(screen.getByRole("link", { name: "Juego 01" })).toHaveAttribute("href", "/games/juego-01");
    expect(screen.getByText("Juego 01, juego de prueba.")).toBeInTheDocument();
  });

  it("moves to the next game on its own", () => {
    render(<FeaturedGamesCarousel games={games} />);

    advance(AUTOPLAY_MS + 100);

    expect(currentTitle()).toHaveTextContent("Juego 02");
  });

  it("stays on the current game when the visitor prefers reduced motion", () => {
    stubReducedMotion();
    render(<FeaturedGamesCarousel games={games} />);

    advance(AUTOPLAY_MS * 2);

    expect(currentTitle()).toHaveTextContent("Juego 01");
  });

  it("goes forward and back with the arrows, wrapping around the ends", () => {
    render(<FeaturedGamesCarousel games={games} />);

    pressArrow("Juego anterior");
    expect(currentTitle()).toHaveTextContent("Juego 04");

    pressArrow("Juego siguiente");
    pressArrow("Juego siguiente");
    expect(currentTitle()).toHaveTextContent("Juego 02");
  });

  it("shows the game of the pressed thumbnail and marks it as current", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<FeaturedGamesCarousel games={games} />);

    await user.click(screen.getByRole("button", { name: "Juego 03" }));

    expect(currentTitle()).toHaveTextContent("Juego 03");
    expect(screen.getByRole("button", { name: "Juego 03" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Juego 01" })).toHaveAttribute("aria-current", "false");
  });

  it("goes to the next game with a swipe to the left", () => {
    render(<FeaturedGamesCarousel games={games} />);

    const slide = screen.getByRole("group", { name: "Juego 01" });
    fireEvent.touchStart(slide, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(slide, { changedTouches: [{ clientX: 100 }] });

    expect(currentTitle()).toHaveTextContent("Juego 02");
  });
});
