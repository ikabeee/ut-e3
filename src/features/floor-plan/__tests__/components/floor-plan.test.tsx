import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STAND_FIXTURES } from "@features/floor-plan/__tests__/floor-plan-fixtures";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";

const ZONE_TITLES = [
  "Escenario principal",
  "Arena KOF",
  "Mario Kart",
  "Marketplace",
  "Atención",
  "Baños",
  "Descanso",
  "Entrada",
];

const INFO_BOOTH_TITLES = [
  "Ingeniería y Tecnologías",
  "Inscripción al torneo de KOF",
  "Oferta educativa",
  "Patrocinadores",
];

const originalResizeObserver = window.ResizeObserver;

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.ResizeObserver = originalResizeObserver;
  window.matchMedia = originalMatchMedia;
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  window.history.replaceState(null, "", "/");
});

describe("FloorPlan buttons", () => {
  it("renders the croquis section with its heading", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(screen.getByRole("heading", { name: "Croquis" })).toBeInTheDocument();
    expect(document.getElementById("floor-plan")?.tagName).toBe("SECTION");
  });

  it.each([360, 900])("makes every stand and zone a button with its name when the map is %i px wide", (width) => {
    stubContainerWidth(width);
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expectedButtonNames().forEach((name) =>
      expect(screen.getByRole("button", { name })).toHaveAttribute("tabindex", "0"),
    );
  });

  it("switches layout at 600 px of container width", () => {
    expect(getMapViewBox(360)).toBe(getMapViewBox(599));
    expect(getMapViewBox(600)).toBe(getMapViewBox(1200));
    expect(getMapViewBox(600)).not.toBe(getMapViewBox(599));
  });
});

describe("FloorPlan selection", () => {
  it("selects zA-s1 by default", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(screen.getByRole("button", { name: "Stand zA-s1, Ceniza Protocol" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Stand zA-s3, Hormigón" })).not.toHaveAttribute("aria-current");
    expect(getPanel().getByRole("heading", { name: "Ceniza Protocol" })).toBeInTheDocument();
  });

  it("shows the name, genre, synopsis, code and cover of a clicked stand", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Stand zB-s2, Kaiju Mercado" }));

    const panel = getPanel();
    expect(panel.getByRole("heading", { name: "Kaiju Mercado" })).toBeInTheDocument();
    expect(panel.getByText("Stand zB-s2 · Simulación")).toBeInTheDocument();
    expect(panel.getByText("Administra un tianguis donde los clientes miden treinta metros.")).toBeInTheDocument();
    expect(panel.getByRole("img", { name: "Portada de Kaiju Mercado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stand zB-s2, Kaiju Mercado" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Stand zA-s1, Ceniza Protocol" })).not.toHaveAttribute("aria-current");
  });

  it("shows an info booth as informative without a cover", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Stand zC-s2, Inscripción al torneo de KOF" }));

    const panel = getPanel();
    expect(panel.getByRole("heading", { name: "Inscripción al torneo de KOF" })).toBeInTheDocument();
    expect(panel.getByText("Stand zC-s2 · Informativo")).toBeInTheDocument();
    expect(panel.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows a zone with its title and no cover", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Arena KOF" }));

    expect(getPanel().getByRole("heading", { name: "Arena KOF" })).toBeInTheDocument();
    expect(getPanel().queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows Stand por asignar for a team position without a stand", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Stand zA-s9" }));

    const panel = getPanel();
    expect(panel.getByText("Stand por asignar")).toBeInTheDocument();
    expect(panel.getByText(/zA-s9/)).toBeInTheDocument();
    expect(panel.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("FloorPlan keyboard", () => {
  it("selects a focused zone with Enter", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    screen.getByRole("button", { name: "Escenario principal" }).focus();
    await userEvent.setup().keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Escenario principal" })).toHaveAttribute("aria-current", "true");
    expect(getPanel().getByRole("heading", { name: "Escenario principal" })).toBeInTheDocument();
  });

  it("selects a focused stand with Space", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    screen.getByRole("button", { name: "Stand zA-s3, Hormigón" }).focus();
    await userEvent.setup().keyboard(" ");

    expect(getPanel().getByRole("heading", { name: "Hormigón" })).toBeInTheDocument();
  });
});

describe("FloorPlan legend", () => {
  it("lists team stand, info stand, activity zone and services", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const legend = screen.getByText("Stand de equipo").closest("ul");

    if (!legend) throw new Error("The legend list is missing");

    expect(
      within(legend)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Stand de equipo", "Stand informativo", "Escenario y actividades", "Servicios"]);
  });
});

describe("FloorPlan URL hash", () => {
  it("selects the zone named by the initial hash", async () => {
    window.history.replaceState(null, "", "#floor-plan-marketplace");
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Marketplace" })).toHaveAttribute("aria-current", "true"),
    );
    expect(getPanel().getByRole("heading", { name: "Marketplace" })).toBeInTheDocument();
  });

  it("selects the stand named by a hashchange", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    changeHash("#floor-plan-zA-s3");

    await waitFor(() => expect(getPanel().getByRole("heading", { name: "Hormigón" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Stand zA-s3, Hormigón" })).toHaveAttribute("aria-current", "true");
  });

  it("keeps the selection when the hash names an unknown item or another section", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    changeHash("#floor-plan-nowhere");
    changeHash("#games");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Stand zA-s1, Ceniza Protocol" })).toHaveAttribute(
        "aria-current",
        "true",
      ),
    );
  });
});

describe("FloorPlan scrolling", () => {
  it("scrolls the section into view smoothly after a hash selection", async () => {
    const scrollIntoView = stubScrollIntoView();
    render(<FloorPlan stands={STAND_FIXTURES} />);

    changeHash("#floor-plan-kof");

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" }));
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("floor-plan"));
  });

  it("scrolls without animation when the visitor prefers reduced motion", async () => {
    const scrollIntoView = stubScrollIntoView();
    stubReducedMotion();
    render(<FloorPlan stands={STAND_FIXTURES} />);

    changeHash("#floor-plan-kof");

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" }));
  });

  it("does not scroll when the visitor selects an item by hand", async () => {
    const scrollIntoView = stubScrollIntoView();
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Descanso" }));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

function expectedButtonNames() {
  const teamNames = ["A", "B"].flatMap((zone) =>
    Array.from({ length: 9 }, (_, index) => {
      const code = `z${zone}-s${index + 1}`;
      const stand = STAND_FIXTURES.find((candidate) => candidate.code === code);

      return stand ? `Stand ${code}, ${stand.name}` : `Stand ${code}`;
    }),
  );

  const boothNames = INFO_BOOTH_TITLES.map((title, index) => `Stand zC-s${index + 1}, ${title}`);

  return [...teamNames, ...boothNames, ...ZONE_TITLES];
}

function getPanel() {
  const panel = document.querySelector('[aria-live="polite"]');

  if (!(panel instanceof HTMLElement)) throw new Error("The side panel with aria-live polite is missing");

  return within(panel);
}

function changeHash(hash: string) {
  window.history.replaceState(null, "", hash);
  act(() => {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

function getMapViewBox(width: number) {
  stubContainerWidth(width);
  const { unmount } = render(<FloorPlan stands={STAND_FIXTURES} />);

  const viewBox = screen
    .getByRole("button", { name: "Stand zA-s1, Ceniza Protocol" })
    .closest("svg")
    ?.getAttribute("viewBox");

  unmount();

  return viewBox;
}

function stubContainerWidth(width: number) {
  class FixedWidthResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      // SAFETY: the stub only provides the contentRect width that the component reads.
      const entry = { target, contentRect: { width } } as ResizeObserverEntry;
      this.callback([entry], this);
    }

    unobserve() {}

    disconnect() {}
  }

  window.ResizeObserver = FixedWidthResizeObserver;
}

function stubScrollIntoView() {
  const scrollIntoView = jest.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: scrollIntoView,
  });

  return scrollIntoView;
}

function stubReducedMotion() {
  window.matchMedia = (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}
