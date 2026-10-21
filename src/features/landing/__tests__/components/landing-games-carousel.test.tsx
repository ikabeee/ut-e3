import { fireEvent, screen } from "@testing-library/react";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import { renderWithGames } from "@features/games/__tests__/render-with-games";
import { getGamePath } from "@features/games/lib/game-links";
import { LandingGamesCarousel } from "@features/landing/components/landing-games-carousel";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const COPY = LANDING_COPY.games;
const TOTAL = GAME_FIXTURES.length;

function mockTrack(track: HTMLElement) {
  Object.defineProperties(track, {
    scrollWidth: { value: TOTAL * 100 },
    clientWidth: { value: 100 },
    scrollLeft: { value: 0, writable: true },
  });
  track.scrollTo = jest.fn();
}

describe("LandingGamesCarousel", () => {
  it("shows one card per game with name, genre and a link to the detail", () => {
    renderWithGames(<LandingGamesCarousel />);

    const [first] = GAME_FIXTURES;
    expect(screen.getAllByRole("article")).toHaveLength(TOTAL);
    expect(screen.getByRole("heading", { name: first.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COPY.viewGame(first.name) })).toHaveAttribute(
      "href",
      getGamePath(first.slug),
    );
  });

  it("starts the counter on 1/total", () => {
    renderWithGames(<LandingGamesCarousel />);

    expect(screen.getByText(COPY.counter(1, TOTAL))).toBeInTheDocument();
  });

  it("updates the counter when the track scrolls", () => {
    renderWithGames(<LandingGamesCarousel />);
    const track = screen.getByRole("region", { name: COPY.carouselLabel });
    mockTrack(track);

    track.scrollLeft = 200;
    fireEvent.scroll(track);

    expect(screen.getByText(COPY.counter(3, TOTAL))).toBeInTheDocument();
  });

  it("scrolls the track from the next and previous buttons", () => {
    renderWithGames(<LandingGamesCarousel />);
    const track = screen.getByRole("region", { name: COPY.carouselLabel });
    mockTrack(track);

    fireEvent.click(screen.getByRole("button", { name: COPY.next }));

    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 100 }));
    expect(screen.getByRole("button", { name: COPY.previous })).toBeInTheDocument();
  });

  it("makes the track reachable with the keyboard", () => {
    renderWithGames(<LandingGamesCarousel />);

    expect(screen.getByRole("region", { name: COPY.carouselLabel })).toHaveAttribute("tabindex", "0");
  });
});
