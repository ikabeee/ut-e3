import { act, fireEvent, render, screen } from "@testing-library/react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { FeaturedGames } from "@features/games/components/featured-games";

const AUTOPLAY_MS = 6500;

const games = makeGames(4);

class TestPointerEvent extends MouseEvent {
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? "";
  }
}

function currentTitle() {
  return screen.getByRole("heading", { level: 2 });
}

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

describe("FeaturedGames autoplay pause", () => {
  beforeAll(() => {
    // SAFETY: TestPointerEvent implements the PointerEvent constructor used by the jsdom tests.
    globalThis.PointerEvent ??= TestPointerEvent as typeof PointerEvent;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("pauses while the mouse is over the carousel and resumes when it leaves", () => {
    render(<FeaturedGames games={games} />);
    const carousel = screen.getByRole("region");

    fireEvent.pointerOver(carousel, { pointerType: "mouse" });
    advance(AUTOPLAY_MS * 2);
    expect(currentTitle()).toHaveTextContent("Juego 01");

    fireEvent.pointerOut(carousel, { pointerType: "mouse" });
    advance(AUTOPLAY_MS + 100);
    expect(currentTitle()).toHaveTextContent("Juego 02");
  });

  it("pauses while the focus is inside the carousel", () => {
    render(<FeaturedGames games={games} />);

    fireEvent.focusIn(screen.getByRole("button", { name: "Juego 03" }));
    advance(AUTOPLAY_MS * 2);

    expect(currentTitle()).toHaveTextContent("Juego 01");
  });

  it("changes game when a touch swipe is longer than 60 px", () => {
    render(<FeaturedGames games={games} />);
    const slide = screen.getAllByRole("group", { hidden: true })[0];

    fireEvent.touchStart(slide, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slide, { changedTouches: [{ clientX: 130 }] });

    expect(currentTitle()).toHaveTextContent("Juego 02");
  });

  it("ignores a touch swipe of 60 px or less", () => {
    render(<FeaturedGames games={games} />);
    const slide = screen.getAllByRole("group", { hidden: true })[0];

    fireEvent.touchStart(slide, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slide, { changedTouches: [{ clientX: 140 }] });

    expect(currentTitle()).toHaveTextContent("Juego 01");
  });
});
