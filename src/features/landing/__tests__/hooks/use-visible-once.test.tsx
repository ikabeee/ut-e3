import { act, render, screen } from "@testing-library/react";
import { useVisibleOnce } from "@features/landing/hooks/use-visible-once";

let observers: FakeObserver[] = [];

class FakeObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds = [];
  isDisconnected = false;

  constructor(private readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }

  observe() {}

  unobserve() {}

  takeRecords() {
    return [];
  }

  disconnect() {
    this.isDisconnected = true;
  }

  show(isIntersecting: boolean) {
    this.callback([makeEntry(isIntersecting)], this);
  }
}

function makeEntry(isIntersecting: boolean): IntersectionObserverEntry {
  const rect = new DOMRectReadOnly();

  return {
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    target: document.body,
    time: 0,
  };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "IntersectionObserver");
  observers = [];
});

function Probe() {
  const [ref, isVisible] = useVisibleOnce<HTMLDivElement>();

  return <div ref={ref}>{isVisible ? "visible" : "hidden"}</div>;
}

describe("useVisibleOnce", () => {
  it("stays hidden where there is no IntersectionObserver", () => {
    render(<Probe />);

    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("turns visible once the element is about to be seen and stops observing", () => {
    globalThis.IntersectionObserver = FakeObserver;
    render(<Probe />);

    act(() => observers[0].show(false));
    expect(screen.getByText("hidden")).toBeInTheDocument();

    act(() => observers[0].show(true));
    expect(screen.getByText("visible")).toBeInTheDocument();
    expect(observers[0].isDisconnected).toBe(true);
  });
});
