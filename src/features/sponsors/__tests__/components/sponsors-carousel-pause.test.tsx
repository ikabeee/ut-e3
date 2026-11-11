import { act, fireEvent, render, screen } from "@testing-library/react";
import { SPONSORS } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorsCarousel } from "@features/sponsors/components/sponsors-carousel";

const AUTOPLAY_MS = 6500;

class TestPointerEvent extends MouseEvent {
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? "";
  }
}

function currentName() {
  return screen.getByRole("heading", { level: 2 });
}

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

describe("SponsorsCarousel autoplay pause", () => {
  beforeAll(() => {
    // SAFETY: TestPointerEvent implements the PointerEvent constructor used by the jsdom tests.
    globalThis.PointerEvent ??= TestPointerEvent as typeof PointerEvent;
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("pauses while the mouse is over the carousel and resumes when it leaves", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);
    const carousel = screen.getByRole("region");

    fireEvent.pointerOver(carousel, { pointerType: "mouse" });
    advance(AUTOPLAY_MS * 2);
    expect(currentName()).toHaveTextContent("Pixel Forge");

    fireEvent.pointerOut(carousel, { pointerType: "mouse" });
    advance(AUTOPLAY_MS + 100);
    expect(currentName()).toHaveTextContent("North Byte");
  });

  it("pauses while the focus is inside the carousel", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    fireEvent.focusIn(screen.getByRole("button", { name: "Code Lab" }));
    advance(AUTOPLAY_MS * 2);

    expect(currentName()).toHaveTextContent("Pixel Forge");
  });

  it("changes sponsor when a touch swipe is longer than 60 px", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);
    const slide = screen.getAllByRole("group", { hidden: true })[0];

    fireEvent.touchStart(slide, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slide, { changedTouches: [{ clientX: 130 }] });

    expect(currentName()).toHaveTextContent("North Byte");
  });

  it("ignores a touch swipe of 60 px or less", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);
    const slide = screen.getAllByRole("group", { hidden: true })[0];

    fireEvent.touchStart(slide, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slide, { changedTouches: [{ clientX: 140 }] });

    expect(currentName()).toHaveTextContent("Pixel Forge");
  });
});
