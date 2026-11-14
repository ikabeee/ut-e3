import { render, screen } from "@testing-library/react";
import { EVENT_VENUE } from "@features/landing/lib/venue";
import { FloorPlanPageView, floorPlanPageMetadata } from "@features/floor-plan/pages/floor-plan-page";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";
import { siteConfig } from "@shared/lib/site-config";

const STANDS: FloorPlanStand[] = [
  {
    code: "ZA-S1",
    name: "Ceniza Protocol",
    slug: "ceniza-protocol",
    genre: "Acción",
    synopsis: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
    coverSrc: "/games/ceniza-protocol.jpg",
    coverAlt: "Portada de Ceniza Protocol",
  },
];

function renderPageView(stands: FloorPlanStand[] = STANDS) {
  return render(<FloorPlanPageView stands={stands} siteConfig={siteConfig} venue={EVENT_VENUE} />);
}

describe("floorPlanPageMetadata", () => {
  it("titles the page Croquis with its canonical on /floor-plan", () => {
    expect(floorPlanPageMetadata.title).toBe("Croquis");
    expect(floorPlanPageMetadata.alternates).toEqual({ canonical: "/floor-plan" });
  });

  it("describes the page and shares it with the open graph metadata", () => {
    expect(floorPlanPageMetadata.description).toMatch(/\S/);
    expect(floorPlanPageMetadata.openGraph).toBeDefined();
  });
});

describe("FloorPlanPageView", () => {
  it("shows the Croquis heading with its kicker, lead and summary", () => {
    renderPageView([]);

    expect(screen.getByRole("heading", { level: 1, name: "Croquis" })).toBeInTheDocument();
    expect(screen.getByText("PIXEL & CODE · Edificio B, UT Cancún")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ubica cada stand, las actividades y los servicios del Edificio B. Toca un marcador para ver el juego.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("18 stands · 5 bloques · 3 actividades")).toBeInTheDocument();
  });

  it("shows the event map below the summary", () => {
    renderPageView();

    expect(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baños" })).toBeInTheDocument();
  });
});
