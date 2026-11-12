import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STAND_FIXTURES } from "@features/floor-plan/__tests__/floor-plan-fixtures";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";
import { NAME_SCALE } from "@features/floor-plan/lib/map-viewport";

const STAND_CODES_IN_PLAN_ORDER = [
  "ZT-S2",
  "ZT-S4",
  "ZT-S6",
  "ZT-S1",
  "ZT-S3",
  "ZT-S5",
  "ZC-S3",
  "ZC-S2",
  "ZC-S1",
  "ZA-S3",
  "ZA-S2",
  "ZA-S1",
  "ZD-S3",
  "ZD-S2",
  "ZD-S1",
  "ZB-S3",
  "ZB-S2",
  "ZB-S1",
];

const ZONE_TITLES = [
  "Escenario principal",
  "Arena KOF",
  "Mario Kart",
  "Baños",
  "Marketplace central",
  "Centro de atención 1",
  "Centro de atención 2",
  "Centro de atención 3",
  "Centro de atención 4",
];

const COMPACT_HINT = "Pellizca o toca + para ver los juegos";

function expectedStandName(code: string) {
  const stand = STAND_FIXTURES.find((candidate) => candidate.code === code);

  return stand ? `Stand ${code}, ${stand.name}` : `Stand ${code}`;
}

beforeEach(() => {
  stubMapSize(1200, 800);
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("FloorPlan markers", () => {
  it("renders one button per stand and zone marker with its label", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    [...STAND_CODES_IN_PLAN_ORDER.map(expectedStandName), ...ZONE_TITLES].forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });

  it("makes every marker a real button", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    [...STAND_CODES_IN_PLAN_ORDER.map(expectedStandName), ...ZONE_TITLES].forEach((name) => {
      const marker = screen.getByRole("button", { name });

      expect(marker.tagName).toBe("BUTTON");
      expect(marker).toHaveAttribute("type", "button");
    });
  });

  it("positions the markers in screen space, outside the scaled drawing", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(document.querySelector("svg")).not.toBeNull();
    ["Stand ZA-S1, Ceniza Protocol", "Baños"].forEach((name) => {
      expect(screen.getByRole("button", { name }).closest("svg")).toBeNull();
    });
  });

  it("shows the code badge and the game name below a stand with a game", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const marker = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    expect(within(marker).getByText("ZA-S1")).toBeInTheDocument();
    expect(within(marker).getByText("Ceniza Protocol")).toBeInTheDocument();
  });

  it("shows the cover inside the marker with an empty alt, because the button label names it", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const image = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }).querySelector("img");

    expect(image?.getAttribute("alt")).toBe("");
  });

  it("shows the initials of the game when it has no cover yet", () => {
    render(<FloorPlan stands={[{ ...STAND_FIXTURES[0], coverSrc: null }]} />);

    const marker = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    expect(within(marker).getByText("CP")).toBeInTheDocument();
    expect(marker.querySelector("img")).toBeNull();
  });

  it("shows an empty stand with no name and no image", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const marker = screen.getByRole("button", { name: "Stand ZT-S6" });

    expect(within(marker).getByText("ZT-S6")).toBeInTheDocument();
    expect(marker.querySelector("img")).toBeNull();
  });

  it("shows a zone marker with an inline icon and its name", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const marker = screen.getByRole("button", { name: "Baños" });

    expect(marker.querySelector("svg")).not.toBeNull();
    expect(within(marker).getByText("Baños")).toBeInTheDocument();
  });

  it("labels every block near its stands", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    ["Bloque T", "Bloque C", "Bloque A", "Bloque D", "Bloque B"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});

describe("FloorPlan filters", () => {
  it("starts with Todos pressed and the other chips not", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const filters = within(screen.getByRole("group", { name: "Filtrar marcadores" }));

    expect(filters.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
    ["Stands 18", "Actividades 3", "Servicios 6"].forEach((name) => {
      expect(filters.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("keeps exactly one chip pressed at a time", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    const filters = within(screen.getByRole("group", { name: "Filtrar marcadores" }));

    await user.click(filters.getByRole("button", { name: "Stands 18" }));

    expect(filters.getByRole("button", { name: "Stands 18" })).toHaveAttribute("aria-pressed", "true");
    expect(filters.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows every stand cell, empty ones included, with Stands 18", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stands 18" }));

    expect(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stand ZT-S6" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baños" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Arena KOF" })).not.toBeInTheDocument();
  });

  it("shows only the stage, the KOF arena and Mario Kart with Actividades 3", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Actividades 3" }));

    expect(screen.getByRole("button", { name: "Escenario principal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arena KOF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mario Kart" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Baños" })).not.toBeInTheDocument();
  });

  it("shows the restrooms, the marketplace and the four help centers with Servicios 6", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Servicios 6" }));

    expect(screen.getByRole("button", { name: "Baños" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marketplace central" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Centro de atención 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Centro de atención 4" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Arena KOF" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).not.toBeInTheDocument();
  });

  it("brings every marker back with Todos", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Servicios 6" }));
    await user.click(screen.getByRole("button", { name: "Todos" }));

    expect(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arena KOF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baños" })).toBeInTheDocument();
  });

  it("clears the selection when its marker is filtered out", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));
    await user.click(screen.getByRole("button", { name: "Actividades 3" }));

    expect(screen.queryByRole("region", { name: "Detalle del croquis" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).not.toBeInTheDocument();
  });
});

describe("FloorPlan detail", () => {
  it("renders the croquis section and selects nothing on load", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(document.getElementById("floor-plan")?.tagName).toBe("SECTION");
    expect(screen.getByRole("heading", { name: "Croquis" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Detalle del croquis" })).not.toBeInTheDocument();
    ["Stand ZA-S1, Ceniza Protocol", "Stand ZA-S3, Hormigón", "Baños"].forEach((name) => {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("selecting a stand shows its detail with title, kicker, block line and game link", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    const detail = screen.getByRole("region", { name: "Detalle del croquis" });

    expect(detail).toHaveAttribute("aria-live", "polite");
    expect(within(detail).getByRole("heading", { name: "Ceniza Protocol" })).toBeInTheDocument();
    expect(within(detail).getByText("Stand ZA-S1 · Acción")).toBeInTheDocument();
    expect(
      within(detail).getByText("Shooter de extracción en una ciudad sepultada por ceniza volcánica."),
    ).toBeInTheDocument();
    expect(within(detail).getByText("Bloque A · stand 1 de 3")).toBeInTheDocument();
    expect(within(detail).getByRole("img", { name: "Portada de Ceniza Protocol" })).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: /Ver ficha del juego/ })).toHaveAttribute(
      "href",
      "/games/ceniza-protocol",
    );
    expect(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Stand ZA-S3, Hormigón" })).toHaveAttribute("aria-pressed", "false");
  });

  it("numbers the block line with the position of the stand in its block", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZB-S2, Kaiju Mercado" }));

    expect(screen.getByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Bloque B · stand 2 de 3");
  });

  it("shows the detail title as an h2 on the page variant and as an h3 when embedded", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FloorPlan stands={STAND_FIXTURES} variant="page" />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    expect(screen.getByRole("heading", { name: "Ceniza Protocol" }).tagName).toBe("H2");
    unmount();
    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    expect(screen.getByRole("heading", { name: "Ceniza Protocol" }).tagName).toBe("H3");
  });

  it("keeps the detail open when its marker is chosen again", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    const marker = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    await user.click(marker);
    await user.click(marker);

    expect(screen.getByRole("region", { name: "Detalle del croquis" })).toBeInTheDocument();
    expect(marker).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a zone with its kind and no game link or cover", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Arena KOF" }));

    const detail = screen.getByRole("region", { name: "Detalle del croquis" });

    expect(within(detail).getByRole("heading", { name: "Arena KOF" })).toBeInTheDocument();
    expect(within(detail).getByText("Actividades")).toBeInTheDocument();
    expect(within(detail).queryByRole("link", { name: /Ver ficha del juego/ })).not.toBeInTheDocument();
    expect(within(detail).queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows an empty stand as unassigned with no game link or cover", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZT-S6" }));

    const detail = screen.getByRole("region", { name: "Detalle del croquis" });

    expect(within(detail).getByText("Stand por asignar")).toBeInTheDocument();
    expect(within(detail).queryByRole("link", { name: /Ver ficha del juego/ })).not.toBeInTheDocument();
    expect(within(detail).queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows a generic cover with the name of a game that has no artwork yet", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={[{ ...STAND_FIXTURES[0], coverSrc: null }]} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    const detail = screen.getByRole("region", { name: "Detalle del croquis" });

    expect(within(detail).getByRole("img", { name: "Ceniza Protocol" })).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: /Ver ficha del juego/ })).toHaveAttribute(
      "href",
      "/games/ceniza-protocol",
    );
  });

  it("closes the detail with Cerrar detalle", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));
    await user.click(screen.getByRole("button", { name: "Cerrar detalle" }));

    expect(screen.queryByRole("region", { name: "Detalle del croquis" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("closes the detail with Escape", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    expect(screen.getByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Ceniza Protocol");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "Detalle del croquis" })).not.toBeInTheDocument();
  });

  it("selects a focused marker with the keyboard", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    screen.getByRole("button", { name: "Escenario principal" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Escenario principal");
  });

  it("still opens the detail after a pointer down and up without movement", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const marker = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    marker.dispatchEvent(new PointerEvent("pointerdown", { clientX: 100, clientY: 100, bubbles: true }));
    marker.dispatchEvent(new PointerEvent("pointerup", { clientX: 100, clientY: 100, bubbles: true }));
    marker.click();

    expect(await screen.findByRole("region", { name: "Detalle del croquis" })).toBeInTheDocument();
  });
});

describe("FloorPlan URL hash", () => {
  it("selects the item named by the initial hash", async () => {
    window.history.replaceState(null, "", "#floor-plan-ZA-S3");
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(await screen.findByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Hormigón");
    expect(screen.getByRole("button", { name: "Stand ZA-S3, Hormigón" })).toHaveAttribute("aria-pressed", "true");
  });

  it("selects the item named by a hashchange and centers the map on it at scale 1 or more", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    changeHash("#floor-plan-kof");

    expect(await screen.findByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Arena KOF");
    expect(viewportScale()).not.toBeNull();
    expect(viewportScale()).toBeGreaterThanOrEqual(1);
  });

  it("keeps the selection when the hash names an unknown item or another section", async () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    changeHash("#floor-plan-ZA-S3");

    expect(await screen.findByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Hormigón");

    changeHash("#floor-plan-nowhere");
    changeHash("#games");

    expect(screen.getByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Hormigón");
  });
});

describe("FloorPlan zoom", () => {
  it("exposes the map scale on the viewport", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(viewportScale()).not.toBeNull();
  });

  it("zooms in around the viewport center and back out with its buttons", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    const controls = within(screen.getByRole("group", { name: "Controles del mapa" }));
    const start = viewportScale();

    await user.click(controls.getByRole("button", { name: "Acercar" }));

    expect(viewportScale()).toBeGreaterThan(start);

    await user.click(controls.getByRole("button", { name: "Alejar" }));
    await user.click(controls.getByRole("button", { name: "Alejar" }));

    expect(viewportScale()).toBeLessThan(start);
  });

  it("recenters the map with Centrar el mapa", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    const controls = within(screen.getByRole("group", { name: "Controles del mapa" }));
    const start = viewportScale();

    await user.click(controls.getByRole("button", { name: "Acercar" }));
    await user.click(controls.getByRole("button", { name: "Centrar el mapa" }));

    expect(viewportScale()).toBeCloseTo(start);
  });
});

describe("FloorPlan compact mode", () => {
  it("hides the names and shows the zoom hint below the compact threshold", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await zoomOutUntilCompact(user);

    expect(screen.getByText(COMPACT_HINT)).toBeInTheDocument();
    expect(screen.queryByText("Ceniza Protocol")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baños" })).toBeInTheDocument();
  });

  it("brings the names back when zooming in past the threshold", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await zoomOutUntilCompact(user);
    await user.click(screen.getByRole("button", { name: "Acercar" }));

    expect(screen.queryByText(COMPACT_HINT)).not.toBeInTheDocument();
    expect(screen.getByText("ZA-S1")).toBeInTheDocument();
    expect(screen.queryByText("Ceniza Protocol")).not.toBeInTheDocument();

    await zoomInUntilNamed(user);

    expect(viewportScale()).toBeGreaterThanOrEqual(NAME_SCALE);
    expect(screen.getByText("Ceniza Protocol")).toBeInTheDocument();
  });
});

describe("FloorPlan variants", () => {
  it("lets one finger drag the map on the page variant", () => {
    render(<FloorPlan stands={STAND_FIXTURES} variant="page" />);

    expect(document.querySelector("[data-scale]")?.className).toMatch(/touch-none/);
  });

  it("lets one finger scroll the page on the embedded variant", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(document.querySelector("[data-scale]")?.className).toMatch(/touch-pan-y/);
  });

  it("sizes the viewport height with svh, never vh", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const viewport = document.querySelector("[data-scale]");

    expect(viewport?.className).toMatch(/svh/);
    expect(viewport?.className ?? "").not.toContain("100vh");
  });
});

describe("FloorPlan list and legend", () => {
  it("toggles the list of every filtered item in plan order", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    expect(screen.getByRole("button", { name: "Ver como lista" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Ver como lista" }));

    expect(screen.getByRole("button", { name: "Ocultar lista" })).toHaveAttribute("aria-pressed", "true");

    const list = itemList();

    expect(within(list).getAllByRole("button")).toHaveLength(27);
    expect(within(list).getAllByRole("button")[0]).toHaveAccessibleName("Stand ZT-S2");
    expect(within(list).getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: "Arena KOF" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ocultar lista" }));

    expect(screen.getByRole("button", { name: "Ver como lista" })).toBeInTheDocument();
    expect(document.querySelector("ul:not([aria-label])")).toBeNull();
  });

  it("lists only the filtered items", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Stands 18" }));
    await user.click(screen.getByRole("button", { name: "Ver como lista" }));

    const list = itemList();

    expect(within(list).getAllByRole("button")).toHaveLength(18);
    expect(within(list).queryByRole("button", { name: "Arena KOF" })).not.toBeInTheDocument();
  });

  it("selecting a list entry opens its detail", async () => {
    const user = userEvent.setup();

    render(<FloorPlan stands={STAND_FIXTURES} />);

    await user.click(screen.getByRole("button", { name: "Ver como lista" }));
    await user.click(within(itemList()).getByRole("button", { name: "Stand ZB-S2, Kaiju Mercado" }));

    expect(screen.getByRole("region", { name: "Detalle del croquis" })).toHaveTextContent("Kaiju Mercado");
  });

  it("explains the marker kinds in its legend", () => {
    render(<FloorPlan stands={STAND_FIXTURES} />);

    const legend = screen.getByRole("list", { name: "Simbología" });

    expect(
      within(legend)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Stand", "Actividad o servicio", "Zona"]);
  });
});

async function zoomInUntilNamed(user: ReturnType<typeof userEvent.setup>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (viewportScale() >= NAME_SCALE) return;

    await user.click(screen.getByRole("button", { name: "Acercar" }));
  }

  throw new Error("The map never reached its name scale");
}

function viewportScale(): number {
  const raw = document.querySelector("[data-scale]")?.getAttribute("data-scale");

  if (raw === null || raw === undefined) throw new Error("The map viewport has no scale to read");

  const scale = Number.parseFloat(raw);

  if (Number.isNaN(scale)) throw new Error("The map viewport scale is not a number");

  return scale;
}

function itemList() {
  const list = document.querySelector("ul:not([aria-label])");

  if (!(list instanceof HTMLElement)) throw new Error("The list of filtered items is missing");

  return list;
}

function changeHash(hash: string) {
  window.history.replaceState(null, "", hash);
  act(() => {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

async function zoomOutUntilCompact(user: ReturnType<typeof userEvent.setup>) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (screen.queryByText(COMPACT_HINT)) return;

    await user.click(screen.getByRole("button", { name: "Alejar" }));
  }

  throw new Error("The map never reached its compact mode");
}

function stubMapSize(width: number, height: number): void {
  class SizedResizeObserver implements ResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element): void {
      const entry: ResizeObserverEntry = {
        target,
        contentRect: new DOMRectReadOnly(0, 0, width, height),
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      };

      this.callback([entry], this);
    }

    unobserve(): void {}

    disconnect(): void {}
  }

  window.ResizeObserver = SizedResizeObserver;
}
