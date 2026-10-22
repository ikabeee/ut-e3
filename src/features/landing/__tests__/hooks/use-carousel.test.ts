import { act, renderHook } from "@testing-library/react";
import { useCarousel } from "@features/landing/hooks/use-carousel";

const TOTAL = 4;

/** Pista con 4 tarjetas de 100 px y una ventana de 150 px: de entrada se ven la primera y media segunda. */
function makeTrack(scrollLeft = 0) {
  const track = document.createElement("div");
  Object.defineProperties(track, {
    scrollWidth: { value: 400 },
    clientWidth: { value: 150 },
    scrollLeft: { value: scrollLeft, writable: true },
  });
  track.scrollTo = jest.fn();

  return track;
}

function setup(scrollLeft = 0) {
  const track = makeTrack(scrollLeft);
  const hook = renderHook(() => useCarousel(TOTAL));
  hook.result.current.trackRef.current = track;

  return { track, ...hook };
}

describe("useCarousel", () => {
  it("starts on the first item", () => {
    const { result } = setup();

    expect(result.current.index).toBe(0);
  });

  it("reports the last card that starts inside the view, even if it is cut", () => {
    const { result, track } = setup();

    act(() => result.current.onScroll());
    expect(result.current.index).toBe(1);

    track.scrollLeft = 100;
    act(() => result.current.onScroll());
    expect(result.current.index).toBe(2);
  });

  it("reports the last item when the track reaches its end", () => {
    const { result, track } = setup();

    track.scrollLeft = 250;
    act(() => result.current.onScroll());

    expect(result.current.index).toBe(TOTAL - 1);
  });

  it("scrolls one card forward and backward", () => {
    const { result, track } = setup(100);

    act(() => result.current.next());
    expect(track.scrollTo).toHaveBeenLastCalledWith({ left: 200, behavior: "smooth" });

    act(() => result.current.previous());
    expect(track.scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "smooth" });
  });

  it("does not scroll past the first or last card", () => {
    const first = setup(0);
    act(() => first.result.current.previous());
    expect(first.track.scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "smooth" });

    const last = setup(250);
    act(() => last.result.current.next());
    expect(last.track.scrollTo).toHaveBeenLastCalledWith({ left: 250, behavior: "smooth" });
  });
});
