import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicBracketView } from "@features/tournament/components/public-bracket-view";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import { toPublicBracket, type PublicSnapshot } from "@features/tournament/lib/public-bracket";
import {
  createTestTournament,
  getMatch,
  NOW,
  playUntilFinished,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const CLOSED: PublicSnapshot = { state: "closed", serverNow: 1 };

describe("PublicBracketView", () => {
  it("tells where to follow the tournament when the bracket is closed (S4)", () => {
    renderWithToasts(<PublicBracketView initial={CLOSED} />);

    expect(screen.getByRole("status")).toHaveTextContent("El bracket estará disponible en la pantalla del torneo.");
    expect(screen.queryByRole("heading", { name: "Tablero 1" })).not.toBeInTheDocument();
  });

  it("shows a decorative hourglass that only moves without reduced motion while the bracket is closed (S13)", () => {
    renderWithToasts(<PublicBracketView initial={CLOSED} />);

    const hourglass = screen.getByTestId("waiting-hourglass-icon");

    expect(hourglass).toHaveAttribute("aria-hidden", "true");
    expect(hourglass).toHaveClass("text-accent");
    expect(hourglass.innerHTML).toContain("motion-safe:animate-pulse");
  });

  it("centers the hourglass and the text together while the bracket is closed or pending (S7)", () => {
    const { unmount } = renderWithToasts(<PublicBracketView initial={CLOSED} />);

    const closed = screen.getByRole("status");

    expect(closed.parentElement).toHaveClass("justify-items-center");
    expect(closed.parentElement).not.toHaveClass("justify-items-start");
    expect(closed).toHaveClass("text-center");
    expect(closed.parentElement).toContainElement(screen.getByTestId("waiting-hourglass-icon"));

    unmount();
    renderWithToasts(<PublicBracketView initial={{ state: "pending", serverNow: 1 }} />);

    expect(screen.getByRole("status").parentElement).toHaveClass("justify-items-center");
    expect(screen.getByRole("status")).toHaveClass("text-center");
  });

  it("says the bracket is not ready while it does not exist", () => {
    renderWithToasts(<PublicBracketView initial={{ state: "pending", serverNow: 1 }} />);

    expect(screen.getByRole("status")).toHaveTextContent("El bracket todavía no está listo.");
  });

  it("shows the seven areas with their matches and the players", () => {
    renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} />);

    ["Tablero 1", "Tablero 2", "Tablero 3", "Tablero 4", "Semifinal 1", "Semifinal 2", "Final"].forEach((name) => {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: /^Combate #\d+$/ })).toHaveLength(63);
    expect(screen.getAllByText(/^Tag\d+$/).length).toBeGreaterThan(0);
  });

  it("links to each area so a phone can jump to it (S6)", () => {
    renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} />);

    const nav = screen.getByRole("navigation", { name: "Ir a un tablero" });

    expect(within(nav).getByRole("link", { name: "Tablero 3" })).toHaveAttribute("href", "#area-board_3");
    expect(within(nav).getByRole("link", { name: "Final" })).toHaveAttribute("href", "#area-final");
  });

  it("puts the matches that are being played now on top", () => {
    const base = createTestTournament();
    const started = applyCommand(base, { type: "start_match", matchId: getMatch(base, 5).id }, NOW);

    renderWithToasts(<PublicBracketView initial={openOf(started)} />);

    const live = screen.getByRole("region", { name: "En juego ahora" });

    expect(within(live).getByRole("heading", { name: "Combate #5" })).toBeInTheDocument();
    expect(within(live).getAllByRole("heading", { name: /^Combate #/ })).toHaveLength(1);
  });

  it("says so when no match is being played", () => {
    renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} />);

    expect(
      within(screen.getByRole("region", { name: "En juego ahora" })).getByText("Ningún combate en juego."),
    ).toBeInTheDocument();
  });

  it("marks the winner of a match that finished", () => {
    renderWithToasts(<PublicBracketView initial={openOf(startAndFinish(createTestTournament(), 1, 1))} />);

    const card = screen.getAllByRole("heading", { name: "Combate #1" })[0].closest("li");

    expect(card).toHaveTextContent("Ganó");
    expect(card).toHaveTextContent("Terminado");
  });

  it("announces the champion when the tournament is over", () => {
    renderWithToasts(<PublicBracketView initial={openOf(playUntilFinished(createTestTournament()))} />);

    expect(screen.getByRole("status")).toHaveTextContent(/Campeón: Tag\d+/);
  });

  it("draws the tree and keeps the list, and a button on small screens switches between them (S7)", async () => {
    renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} />);

    expect(screen.getByRole("group", { name: "Bracket en forma de árbol" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Ir a un tablero" })).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Ver el árbol completo" });

    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);

    expect(screen.getByRole("button", { name: "Ver como lista" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Desliza hacia los lados para ver todo el árbol.")).toBeInTheDocument();
  });

  it("never shows an identifier, only gamertags", () => {
    const { container } = renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} />);

    expect(container.textContent).not.toContain("player-");
    expect(container.innerHTML).not.toContain("match-");
  });

  it("hides the bracket on its own when the administrator closes it while the page is open (RF-74)", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockResolvedValue(CLOSED);

      renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} load={load} />);
      expect(screen.getByRole("heading", { name: "Tablero 1" })).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.queryByRole("heading", { name: "Tablero 1" })).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("El bracket estará disponible en la pantalla del torneo.");
    } finally {
      jest.useRealTimers();
    }
  });

  it("warns with a toast when the connection is lost and keeps the bracket", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockRejectedValue(new Error("offline"));

      renderWithToasts(<PublicBracketView initial={openOf(createTestTournament())} load={load} />);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión. Se muestra el último estado recibido.");
      expect(screen.getByRole("heading", { name: "Tablero 1" })).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});

function openOf(tournament: ReturnType<typeof createTestTournament>): PublicSnapshot {
  return { state: "open", bracket: toPublicBracket(tournament), serverNow: 1 };
}
