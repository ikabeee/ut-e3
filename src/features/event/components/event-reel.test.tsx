import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { EventReel } from "@features/event/components/event-reel";
import { EVENT_REEL, REEL_AUTOPLAY_MEDIA_QUERY } from "@features/event/lib/event-media";

interface BrowserConditions {
  isWideScreen?: boolean;
  prefersSaveData?: boolean;
  prefersReducedMotion?: boolean;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const originalMatchMedia = window.matchMedia;

/** Callbacks de los IntersectionObserver creados, para simular que el reel entra a la vista. */
let intersectionCallbacks: IntersectionObserverCallback[] = [];

class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallbacks.push(callback);
  }
  observe() {}
  disconnect() {}
}

function simulateBrowser({ isWideScreen = false, prefersSaveData = false, prefersReducedMotion = false }: BrowserConditions) {
  const matches: Record<string, boolean> = {
    [REEL_AUTOPLAY_MEDIA_QUERY]: isWideScreen,
    [REDUCED_MOTION_QUERY]: prefersReducedMotion,
  };
  window.matchMedia = (query: string) =>
    ({
      matches: matches[query] ?? false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData: prefersSaveData, addEventListener: () => undefined, removeEventListener: () => undefined },
  });
}

function showReel() {
  act(() => {
    for (const callback of intersectionCallbacks) {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
}

const reel = (
  <EventReel reel={EVENT_REEL} reelLabel="Reel 2026">
    <h1>UTG</h1>
  </EventReel>
);

function getVideo(container: HTMLElement) {
  const video = container.querySelector("video");
  if (!video) {
    throw new Error("No se encontró el video del reel");
  }
  return video;
}

let play: jest.SpyInstance;

beforeEach(() => {
  intersectionCallbacks = [];
  Object.defineProperty(window, "IntersectionObserver", { configurable: true, writable: true, value: IntersectionObserverMock });
  play = jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
  Reflect.deleteProperty(navigator, "connection");
});

describe("EventReel", () => {
  it("renders the same server HTML without downloading the video", () => {
    simulateBrowser({ isWideScreen: true });
    const desktopHtml = renderToString(reel);
    simulateBrowser({ isWideScreen: false, prefersSaveData: true, prefersReducedMotion: true });

    expect(renderToString(reel)).toBe(desktopHtml);
    expect(desktopHtml).toContain('preload="none"');
    expect(desktopHtml).toContain('poster="/media/reel.jpg"');
    expect(desktopHtml).not.toContain("<source");
    expect(desktopHtml).not.toContain("autoplay");
  });

  it.each<[string, BrowserConditions]>([
    ["on a narrow screen", { isWideScreen: false }],
    ["when the browser asks to save data", { isWideScreen: true, prefersSaveData: true }],
    ["when the user prefers reduced motion", { isWideScreen: true, prefersReducedMotion: true }],
  ])("only shows the poster %s", (_, conditions) => {
    simulateBrowser(conditions);
    const { container } = render(reel);
    showReel();

    expect(getVideo(container).querySelectorAll("source")).toHaveLength(0);
    expect(play).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reproducir video" })).toBeInTheDocument();
  });

  it("loads the video on demand when the play button is pressed", async () => {
    const user = userEvent.setup();
    simulateBrowser({ isWideScreen: false });
    const { container } = render(reel);

    await user.click(screen.getByRole("button", { name: "Reproducir video" }));

    expect(getVideo(container).querySelectorAll("source")).toHaveLength(2);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("loads and plays the video on a wide screen once the reel is visible", () => {
    simulateBrowser({ isWideScreen: true });
    const { container } = render(reel);
    const video = getVideo(container);

    expect(video.querySelectorAll("source")).toHaveLength(0);

    showReel();

    expect(video.querySelectorAll("source")).toHaveLength(2);
    expect(play).toHaveBeenCalledTimes(1);
  });
});
