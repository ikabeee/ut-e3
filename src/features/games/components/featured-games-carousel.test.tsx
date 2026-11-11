import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { FEATURED_SLIDE_DURATION } from "@features/games/hooks/use-featured-carousel";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

function renderCarousel() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(gamesQueryKeys.list(), [...MOCK_GAMES]);

  return render(
    <QueryClientProvider client={queryClient}>
      <FeaturedGamesCarousel />
    </QueryClientProvider>,
  );
}

function slideTitle() {
  return screen.getByRole("heading", { level: 2 });
}

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

describe("FeaturedGamesCarousel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with the first game and marks its thumbnail", () => {
    renderCarousel();

    expect(slideTitle()).toHaveTextContent("Ceniza Protocol");
    expect(screen.getByRole("button", { name: "Ceniza Protocol" })).toHaveAttribute("aria-current", "true");
  });

  it("moves with the arrows and wraps around", () => {
    renderCarousel();

    fireEvent.click(screen.getByRole("button", { name: "Juego anterior" }));
    expect(slideTitle()).toHaveTextContent("Circuito 7");

    fireEvent.click(screen.getByRole("button", { name: "Juego siguiente" }));
    expect(slideTitle()).toHaveTextContent("Ceniza Protocol");
  });

  it("jumps to a game from its thumbnail", () => {
    renderCarousel();

    fireEvent.click(screen.getByRole("button", { name: "Ruta 9" }));

    expect(slideTitle()).toHaveTextContent("Ruta 9");
  });

  it("advances on its own and pauses while the pointer is over it", () => {
    renderCarousel();

    advance(FEATURED_SLIDE_DURATION + 100);
    expect(slideTitle()).toHaveTextContent("Los Últimos Faros");

    fireEvent.mouseEnter(screen.getByRole("banner"));
    advance(FEATURED_SLIDE_DURATION * 2);
    expect(slideTitle()).toHaveTextContent("Los Últimos Faros");
  });
});
