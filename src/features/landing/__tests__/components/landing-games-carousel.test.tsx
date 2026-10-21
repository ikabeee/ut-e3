import { fireEvent, render, screen } from "@testing-library/react";
import { LandingGamesCarousel } from "@features/landing/components/landing-games-carousel";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { LANDING_GAMES, LANDING_TEAM_COUNT } from "@features/landing/lib/landing-games";

const COPY = LANDING_COPY.games;
const CARDS = LANDING_GAMES.length;

function renderCarousel() {
  return render(<LandingGamesCarousel games={LANDING_GAMES} total={LANDING_TEAM_COUNT} />);
}

function mockTrack(track: HTMLElement) {
  Object.defineProperties(track, {
    scrollWidth: { value: CARDS * 100 },
    clientWidth: { value: 100 },
    scrollLeft: { value: 0, writable: true },
  });
  track.scrollTo = jest.fn();
}

describe("LandingGamesCarousel", () => {
  it("shows one card per game with its name, genre and a link to the catalog", () => {
    renderCarousel();

    const [first] = LANDING_GAMES;
    expect(screen.getAllByRole("article")).toHaveLength(CARDS);
    expect(screen.getByRole("heading", { name: first.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: COPY.viewGame(first.name) })).toHaveAttribute("href", "/games");
  });

  it("starts the counter on 1 over the team total", () => {
    renderCarousel();

    expect(screen.getByText(COPY.counter(1, LANDING_TEAM_COUNT))).toBeInTheDocument();
  });

  it("updates the counter when the track scrolls", () => {
    renderCarousel();
    const track = screen.getByRole("region", { name: COPY.carouselLabel });
    mockTrack(track);

    track.scrollLeft = 200;
    fireEvent.scroll(track);

    expect(screen.getByText(COPY.counter(3, LANDING_TEAM_COUNT))).toBeInTheDocument();
  });

  it("scrolls the track from the next and previous buttons", () => {
    renderCarousel();
    const track = screen.getByRole("region", { name: COPY.carouselLabel });
    mockTrack(track);

    fireEvent.click(screen.getByRole("button", { name: COPY.next }));

    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 100 }));
    expect(screen.getByRole("button", { name: COPY.previous })).toBeInTheDocument();
  });

  it("makes the track reachable with the keyboard", () => {
    renderCarousel();

    expect(screen.getByRole("region", { name: COPY.carouselLabel })).toHaveAttribute("tabindex", "0");
  });
});
