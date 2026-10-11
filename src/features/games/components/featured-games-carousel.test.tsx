import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { FEATURED_SLIDE_DURATION } from "@features/games/hooks/use-featured-carousel";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";

// jsdom no implementa PointerEvent: sin esto, `pointerType` no llega a los manejadores.
class TestPointerEvent extends MouseEvent {
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? "";
  }
}

function renderCarousel() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(gamesQueryKeys.list(), [...GAME_FIXTURES]);

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
  beforeAll(() => {
    globalThis.PointerEvent ??= TestPointerEvent as typeof PointerEvent;
  });

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

  it("advances on its own and pauses while the mouse is over it", () => {
    renderCarousel();

    advance(FEATURED_SLIDE_DURATION + 100);
    expect(slideTitle()).toHaveTextContent("Los Últimos Faros");

    fireEvent.pointerOver(screen.getByRole("banner"), { pointerType: "mouse" });
    advance(FEATURED_SLIDE_DURATION * 2);
    expect(slideTitle()).toHaveTextContent("Los Últimos Faros");

    fireEvent.pointerOut(screen.getByRole("banner"), { pointerType: "mouse" });
    advance(FEATURED_SLIDE_DURATION + 100);
    expect(slideTitle()).toHaveTextContent("Hormigón");
  });

  it("pauses only while a finger touches it and keeps advancing after a tap", () => {
    renderCarousel();
    const carousel = screen.getByRole("banner");

    fireEvent.pointerDown(carousel, { pointerType: "touch" });
    advance(FEATURED_SLIDE_DURATION * 2);
    expect(slideTitle()).toHaveTextContent("Ceniza Protocol");

    // Al tocar, el navegador también emula mouseenter (sin mouseleave): no debe pausar.
    fireEvent.pointerUp(carousel, { pointerType: "touch" });
    fireEvent.mouseEnter(carousel);
    advance(FEATURED_SLIDE_DURATION + 100);
    expect(slideTitle()).toHaveTextContent("Los Últimos Faros");
  });
});
