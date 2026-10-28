import { act, render, screen, within } from "@testing-library/react";
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

const CLOSED: PublicSnapshot = { state: "closed", serverNow: 1 };

describe("PublicBracketView", () => {
  it("tells where to follow the tournament when the bracket is closed (S4)", () => {
    render(<PublicBracketView initial={CLOSED} />);

    expect(screen.getByRole("status")).toHaveTextContent("El bracket está disponible en la pantalla del torneo.");
    expect(screen.queryByRole("heading", { name: "Tablero 1" })).not.toBeInTheDocument();
  });

  it("says the bracket is not ready while it does not exist", () => {
    render(<PublicBracketView initial={{ state: "pending", serverNow: 1 }} />);

    expect(screen.getByRole("status")).toHaveTextContent("El bracket todavía no está listo.");
  });

  it("shows the seven areas with their matches and the players", () => {
    render(<PublicBracketView initial={openOf(createTestTournament())} />);

    ["Tablero 1", "Tablero 2", "Tablero 3", "Tablero 4", "Semifinal 1", "Semifinal 2", "Final"].forEach((name) => {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: /^Combate #\d+$/ })).toHaveLength(63);
    expect(screen.getAllByText(/^Tag\d+$/).length).toBeGreaterThan(0);
  });

  it("links to each area so a phone can jump to it (S6)", () => {
    render(<PublicBracketView initial={openOf(createTestTournament())} />);

    const nav = screen.getByRole("navigation", { name: "Ir a un tablero" });

    expect(within(nav).getByRole("link", { name: "Tablero 3" })).toHaveAttribute("href", "#area-board_3");
    expect(within(nav).getByRole("link", { name: "Final" })).toHaveAttribute("href", "#area-final");
  });

  it("puts the matches that are being played now on top", () => {
    const base = createTestTournament();
    const started = applyCommand(base, { type: "start_match", matchId: getMatch(base, 5).id }, NOW);

    render(<PublicBracketView initial={openOf(started)} />);

    const live = screen.getByRole("region", { name: "En juego ahora" });

    expect(within(live).getByRole("heading", { name: "Combate #5" })).toBeInTheDocument();
    expect(within(live).getAllByRole("heading", { name: /^Combate #/ })).toHaveLength(1);
  });

  it("says so when no match is being played", () => {
    render(<PublicBracketView initial={openOf(createTestTournament())} />);

    expect(
      within(screen.getByRole("region", { name: "En juego ahora" })).getByText("Ningún combate en juego."),
    ).toBeInTheDocument();
  });

  it("marks the winner of a match that finished", () => {
    render(<PublicBracketView initial={openOf(startAndFinish(createTestTournament(), 1, 1))} />);

    const card = screen.getAllByRole("heading", { name: "Combate #1" })[0].closest("li");

    expect(card).toHaveTextContent("Ganó");
    expect(card).toHaveTextContent("Terminado");
  });

  it("announces the champion when the tournament is over", () => {
    render(<PublicBracketView initial={openOf(playUntilFinished(createTestTournament()))} />);

    expect(screen.getByRole("status")).toHaveTextContent(/Campeón: Tag\d+/);
  });

  it("never shows an identifier, only gamertags", () => {
    const { container } = render(<PublicBracketView initial={openOf(createTestTournament())} />);

    expect(container.textContent).not.toContain("player-");
    expect(container.innerHTML).not.toContain("match-");
  });

  it("hides the bracket on its own when the administrator closes it while the page is open (RF-74)", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockResolvedValue(CLOSED);

      render(<PublicBracketView initial={openOf(createTestTournament())} load={load} />);
      expect(screen.getByRole("heading", { name: "Tablero 1" })).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.queryByRole("heading", { name: "Tablero 1" })).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("El bracket está disponible en la pantalla del torneo.");
    } finally {
      jest.useRealTimers();
    }
  });

  it("warns when the connection is lost and keeps the bracket", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockRejectedValue(new Error("offline"));

      render(<PublicBracketView initial={openOf(createTestTournament())} load={load} />);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByText("Sin conexión. Se muestra el último estado recibido.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Tablero 1" })).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});

function openOf(tournament: ReturnType<typeof createTestTournament>): PublicSnapshot {
  return { state: "open", bracket: toPublicBracket(tournament), serverNow: 1 };
}
