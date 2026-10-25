import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoHero } from "@features/landing/components/video-hero";

const CALENDAR_URL = "https://calendar.google.com/calendar/render?action=TEMPLATE";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const PLAY_BUTTON_NAME = "Reproducir video";

interface BrowserConditions {
  prefersSaveData?: boolean;
  prefersReducedMotion?: boolean;
}

let intersectionCallbacks: IntersectionObserverCallback[] = [];

class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallbacks.push(callback);
  }
  observe() {}
  disconnect() {}
}

let play: jest.SpyInstance;

let pause: jest.SpyInstance;

beforeEach(() => {
  intersectionCallbacks = [];
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: IntersectionObserverMock,
  });
  play = jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  pause = jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(navigator, "connection");
});

describe("VideoHero", () => {
  it("shows the slogan as the page title", () => {
    simulateBrowser({});
    renderHero();

    expect(screen.getByRole("heading", { level: 1, name: /Showcase de videojuegos/ })).toBeInTheDocument();
  });

  it("shows neither an event kicker nor a reel badge", () => {
    simulateBrowser({});
    renderHero();

    expect(screen.queryByText(/Entrada libre/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reel/)).not.toBeInTheDocument();
  });

  it("opens the calendar in a new tab from the call to action", () => {
    simulateBrowser({});
    renderHero();

    const cta = screen.getByRole("link", { name: /Quiero participar/ });

    expect(cta).toHaveAttribute("href", CALENDAR_URL);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("is the top anchor of the page and shows no timecode", () => {
    simulateBrowser({});
    const { container } = renderHero();

    expect(container.querySelector("#top")).toBeInTheDocument();
    expect(screen.queryByText("00:00:00")).not.toBeInTheDocument();
  });

  it("starts with the poster only: no autoplay attribute, no preload and no sources", () => {
    simulateBrowser({});
    const { container } = renderHero();
    const video = getVideo(container);

    expect(video).toHaveAttribute("poster", "/media/hero-loop-poster.jpg");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.querySelectorAll("source")).toHaveLength(0);
  });

  it("plays the webm and mp4 loop once it is visible, also on a phone", () => {
    simulateBrowser({});
    const { container } = renderHero();

    showLoop();

    const sources = Array.from(getVideo(container).querySelectorAll("source"));

    expect(sources.map((source) => source.getAttribute("src"))).toEqual([
      "/media/hero-loop.webm",
      "/media/hero-loop.mp4",
    ]);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it.each<[string, BrowserConditions]>([
    ["when the browser asks to save data", { prefersSaveData: true }],
    ["when the user prefers reduced motion", { prefersReducedMotion: true }],
  ])("does not autoplay %s", (_, conditions) => {
    simulateBrowser(conditions);
    const { container } = renderHero();

    showLoop();

    expect(play).not.toHaveBeenCalled();
    expect(getVideo(container).querySelectorAll("source")).toHaveLength(0);
  });

  it("toggles aria-pressed as the video plays and pauses from the button", async () => {
    simulateBrowser({});
    const user = userEvent.setup();
    const { container } = renderHero();
    const video = getVideo(container);
    const button = screen.getByRole("button", { name: PLAY_BUTTON_NAME });

    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.play(video);
    expect(screen.getByRole("button", { name: PLAY_BUTTON_NAME })).toHaveAttribute("aria-pressed", "true");

    Object.defineProperty(video, "paused", { configurable: true, value: false });
    await user.click(screen.getByRole("button", { name: PLAY_BUTTON_NAME }));
    expect(pause).toHaveBeenCalled();
    fireEvent.pause(video);
    expect(screen.getByRole("button", { name: PLAY_BUTTON_NAME })).toHaveAttribute("aria-pressed", "false");
  });
});

function renderHero() {
  return render(<VideoHero calendarUrl={CALENDAR_URL} />);
}

function simulateBrowser({ prefersSaveData = false, prefersReducedMotion = false }: BrowserConditions) {
  const matches = new Map([[REDUCED_MOTION_QUERY, prefersReducedMotion]]);

  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: matches.get(query) ?? false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData: prefersSaveData, addEventListener: () => undefined, removeEventListener: () => undefined },
  });
}

function showLoop() {
  act(() => {
    for (const callback of intersectionCallbacks) {
      // SAFETY: the test simulates the single entry the observer callback reads.
      const entry = { isIntersecting: true } as IntersectionObserverEntry;
      // SAFETY: the callback receives the observer instance but does not use it here.
      const observer = {} as IntersectionObserver;
      callback([entry], observer);
    }
  });
}

function getVideo(container: HTMLElement) {
  const video = container.querySelector("video");

  if (!video) {
    throw new Error("The hero loop video was not rendered");
  }

  return video;
}
