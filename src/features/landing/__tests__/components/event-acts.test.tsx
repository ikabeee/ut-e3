import { act, render, screen, within } from "@testing-library/react";
import { EventActs } from "@features/landing/components/event-acts";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const ACT_NAMES = ["JUEGA", "CALIFICA", "GANA"];

const RAFFLE = { startsAtLabel: "18:00", cutoffLabel: "17:00" };

const KOF = { checkInLabel: "11:00 a 12:00", onsiteSignupLabel: "12:00 a 12:45" };

const MARKETPLACE_TEXT = "Contenido del marketplace";

class IntersectionObserverMock {
  readonly targets: Element[] = [];

  constructor(readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }

  observe(target: Element) {
    this.targets.push(target);
  }

  unobserve() {}

  disconnect() {}
}

let observers: IntersectionObserverMock[] = [];

beforeEach(() => {
  observers = [];
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: IntersectionObserverMock,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("EventActs", () => {
  it("is the event section with the three acts in order: JUEGA, CALIFICA, GANA", () => {
    const { container } = renderActs();

    const headings = screen
      .getAllByRole("heading")
      .map((heading) => heading.textContent ?? "")
      .filter((text) => ACT_NAMES.includes(text));

    expect(container.querySelector("section#event")).toBeInTheDocument();
    expect(headings).toEqual(ACT_NAMES);
  });

  it("says how many games the students made in the division", () => {
    renderActs({ gamesCount: 18 });

    expect(actOf("JUEGA")).toHaveTextContent(
      "18 juegos hechos por estudiantes de la División de Ingeniería y Tecnologías",
    );
  });

  it("explains in CALIFICA the PIN, the three ratings and a ticket at 9 and 18 valid visits until the cutoff", () => {
    renderActs();

    const rate = actOf("CALIFICA");

    expect(rate).toHaveTextContent(/PIN/);
    expect(rate).toHaveTextContent(/juego/);
    expect(rate).toHaveTextContent(/stand/);
    expect(rate).toHaveTextContent(/arte/);
    expect(rate).toHaveTextContent(/\b9\b/);
    expect(rate).toHaveTextContent(/\b18\b/);
    expect(rate).toHaveTextContent(RAFFLE.cutoffLabel);
    expect(within(rate).getAllByText("+1 boleto")).toHaveLength(2);
  });

  it("shows the KOF tournament with 64 players, the check-in range and the on-site signup range", () => {
    renderActs();

    const win = actOf("GANA");

    expect(win).toHaveTextContent("Torneo de KOF");
    expect(win).toHaveTextContent("64 jugadores");
    expect(win).toHaveTextContent(`check-in ${KOF.checkInLabel}`);
    expect(win).toHaveTextContent(`inscripción presencial ${KOF.onsiteSignupLabel}`);
  });

  it("shows Mario Kart as an invitation without links or buttons", () => {
    renderActs();

    const win = actOf("GANA");

    expect(win).toHaveTextContent("Mario Kart");
    expect(win).toHaveTextContent("Súbete cuando quieras");
    expect(within(win).queryByRole("link")).not.toBeInTheDocument();
    expect(within(win).queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the raffle start with the tickets of the visits", () => {
    renderActs();

    const win = actOf("GANA");

    expect(win).toHaveTextContent("Rifa");
    expect(win).toHaveTextContent(RAFFLE.startsAtLabel);
    expect(win).toHaveTextContent("con tus boletos");
  });

  it("renders the marketplace slot inside the section, after the acts", () => {
    const { container } = renderActs();

    const slot = screen.getByText(MARKETPLACE_TEXT);

    expect(container.querySelector("section#event")).toContainElement(slot);
    expect(isBefore(actOf("GANA"), slot)).toBe(true);
  });

  it("hides the pictograms from assistive technology and keeps every fact as real text", () => {
    const { container } = renderActs();

    const pictograms = Array.from(container.querySelectorAll("svg"));

    expect(pictograms.length).toBeGreaterThanOrEqual(5);
    pictograms.forEach((pictogram) => expect(pictogram).toHaveAttribute("aria-hidden", "true"));
    expect(container.querySelector("svg text")).not.toBeInTheDocument();
  });

  it("waits for the section to be visible before playing the acts", () => {
    const { container } = renderActs();

    expect(motionStates(container)).not.toHaveLength(0);
    expect(new Set(motionStates(container))).toEqual(new Set(["idle"]));

    reportVisible();

    expect(new Set(motionStates(container))).toEqual(new Set(["played"]));
  });

  it("plays once: leaving the viewport does not rewind the acts", () => {
    const { container } = renderActs();

    reportVisible();
    reportHidden();

    expect(new Set(motionStates(container))).toEqual(new Set(["played"]));
  });

  it("renders the final frame at once when the user prefers reduced motion", () => {
    simulateReducedMotion();
    const { container } = renderActs();

    expect(motionStates(container)).not.toHaveLength(0);
    expect(new Set(motionStates(container))).toEqual(new Set(["played"]));
  });
});

interface ActsOverrides {
  gamesCount?: number;
}

function renderActs({ gamesCount = 18 }: ActsOverrides = {}) {
  return render(
    <EventActs gamesCount={gamesCount} raffle={RAFFLE} kof={KOF} marketplace={<p>{MARKETPLACE_TEXT}</p>} />,
  );
}

function actOf(name: string) {
  let wrapper = screen.getByRole("heading", { name });

  while (wrapper.parentElement && actsInside(wrapper.parentElement) === 1) {
    wrapper = wrapper.parentElement;
  }

  return wrapper;
}

function actsInside(element: HTMLElement) {
  return ACT_NAMES.filter((name) => within(element).queryByRole("heading", { name })).length;
}

function isBefore(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function motionStates(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-motion]")).map((element) => element.getAttribute("data-motion"));
}

function reportVisible() {
  reportIntersection(true);
}

function reportHidden() {
  reportIntersection(false);
}

function reportIntersection(isIntersecting: boolean) {
  act(() => {
    for (const observer of observers) {
      // SAFETY: the test simulates the entry fields the observer callback reads.
      const entries = observer.targets.map((target) => ({ isIntersecting, target }) as IntersectionObserverEntry);
      // SAFETY: the callback receives the observer instance but does not use it here.
      const instance = {} as IntersectionObserver;
      observer.callback(entries, instance);
    }
  });
}

function simulateReducedMotion() {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query === REDUCED_MOTION_QUERY,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
}
