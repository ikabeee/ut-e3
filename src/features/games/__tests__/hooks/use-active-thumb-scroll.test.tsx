import { render } from "@testing-library/react";
import { useActiveThumbScroll } from "@features/games/hooks/use-active-thumb-scroll";

function TestThumbs({ activeIndex }: Readonly<{ activeIndex: number }>) {
  const trackRef = useActiveThumbScroll<HTMLDivElement>(activeIndex);
  return (
    <div ref={trackRef}>
      <button type="button">Uno</button>
      <button type="button">Dos</button>
    </div>
  );
}

describe("useActiveThumbScroll", () => {
  const scrollTo = jest.fn();
  const { matchMedia } = window;

  beforeEach(() => {
    scrollTo.mockClear();
    Element.prototype.scrollTo = scrollTo;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.matchMedia = matchMedia;
  });

  it("scrolls the track to the active thumbnail, leaving a small margin", () => {
    // jsdom no calcula el layout: se simula la posición de cada miniatura.
    jest.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
      return this.textContent === "Dos" ? 220 : 0;
    });

    const { rerender } = render(<TestThumbs activeIndex={0} />);
    rerender(<TestThumbs activeIndex={1} />);

    expect(scrollTo).toHaveBeenLastCalledWith({ left: 212, behavior: "smooth" });
  });

  it("jumps without animation when the person prefers reduced motion", () => {
    window.matchMedia = ((query: string) => ({ ...matchMedia(query), matches: true })) as typeof window.matchMedia;

    render(<TestThumbs activeIndex={1} />);

    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "auto" }));
  });
});
