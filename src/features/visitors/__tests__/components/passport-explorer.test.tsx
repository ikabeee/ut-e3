import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { PassportExplorer } from "@features/visitors/components/passport-explorer";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.passport.explorer;

const STANDS_COPY = VISITORS_COPY.passport.stands;

const GAMES = [
  makeGame({ id: "ceniza-protocol", name: "Ceniza Protocol", stand: { zone: "A", number: 1 } }),
  makeGame({ id: "hormigon", name: "Hormigón", stand: { zone: "A", number: 3 } }),
];

const STANDS = [
  { code: "ZA-S1", visited: true, gameName: "Ceniza Protocol" },
  { code: "ZA-S3", visited: false, gameName: "Hormigón" },
];

beforeEach(() => {
  stubMapSize(1200, 800);
});

describe("PassportExplorer", () => {
  it("asks the visitor to tap a stand while nothing is selected", () => {
    render(<PassportExplorer games={GAMES} stands={STANDS} />);

    expect(detailPanel()).toHaveTextContent(COPY.empty);
    expect(screen.getByRole("heading", { name: COPY.mapTitle })).toBeInTheDocument();
  });

  it("shows the game of the stand selected on the map in the detail panel, with its visit (S18)", async () => {
    render(<PassportExplorer games={GAMES} stands={STANDS} />);

    const marker = screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" });

    await userEvent.click(marker);

    const detail = detailPanel();

    expect(marker).toHaveAttribute("aria-pressed", "true");
    expect(within(detail).getByRole("heading", { name: "Ceniza Protocol" })).toBeInTheDocument();
    expect(detail).toHaveTextContent("Acción · ZA-S1");
    expect(detail).toHaveTextContent("Ceniza Protocol, juego de prueba.");
    expect(detail).toHaveTextContent(STANDS_COPY.visited);
    expect(within(detail).getByRole("link")).toHaveAttribute("href", "/games/ceniza-protocol");
    expect(detail).not.toHaveTextContent(COPY.empty);
  });

  it("replaces the detail when another stand is selected and says it is still pending", async () => {
    render(<PassportExplorer games={GAMES} stands={STANDS} />);

    await userEvent.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));
    await userEvent.click(screen.getByRole("button", { name: "Stand ZA-S3, Hormigón" }));

    const detail = detailPanel();

    expect(within(detail).getByRole("heading", { name: "Hormigón" })).toBeInTheDocument();
    expect(within(detail).queryByRole("heading", { name: "Ceniza Protocol" })).not.toBeInTheDocument();
    expect(detail).toHaveTextContent(STANDS_COPY.pending);
  });

  it("describes a zone without a game link nor a visit status", async () => {
    render(<PassportExplorer games={GAMES} stands={STANDS} />);

    await userEvent.click(screen.getByRole("button", { name: "Arena KOF" }));

    const detail = detailPanel();

    expect(within(detail).getByRole("heading", { name: "Arena KOF" })).toBeInTheDocument();
    expect(detail).toHaveTextContent(FLOOR_PLAN_COPY.zones.kof.description);
    expect(within(detail).queryByRole("link")).not.toBeInTheDocument();
    expect(detail).not.toHaveTextContent(STANDS_COPY.visited);
    expect(detail).not.toHaveTextContent(STANDS_COPY.pending);
  });

  it("shows the selection only in the panel, not in the card over the map", async () => {
    render(<PassportExplorer games={GAMES} stands={STANDS} />);

    await userEvent.click(screen.getByRole("button", { name: "Stand ZA-S1, Ceniza Protocol" }));

    expect(screen.queryByRole("region", { name: FLOOR_PLAN_COPY.detailLabel })).not.toBeInTheDocument();
  });
});

function detailPanel(): HTMLElement {
  return screen.getByRole("region", { name: COPY.detailTitle });
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
