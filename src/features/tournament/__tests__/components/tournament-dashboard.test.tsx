import { act, render, screen, within } from "@testing-library/react";
import type { TournamentSnapshot } from "@features/tournament/api/tournament-api-client";
import type { TournamentAction } from "@features/tournament/components/command-button";
import { TournamentDashboard } from "@features/tournament/components/tournament-dashboard";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import { getMatchPlayers } from "@features/tournament/lib/tournament-view";
import type { Tournament } from "@features/tournament/lib/types";
import {
  clearToasts,
  createTestTournament,
  getMatch,
  NOW,
  playUntilFinished,
} from "@features/tournament/__tests__/tournament-test-utils";

type Viewer = Parameters<typeof TournamentDashboard>[0]["viewer"];

function renderDashboard(initial: Tournament | null, viewer: Viewer, load?: () => Promise<TournamentSnapshot>) {
  return render(<TournamentDashboard initial={initial} viewer={viewer} action={action} load={load} />);
}

const action: TournamentAction = async () => ({ status: "applied" });

afterEach(clearToasts);

describe("TournamentDashboard", () => {
  it("explains that the bracket does not exist yet", () => {
    renderDashboard(null, { role: "kof_admin", desk: null });

    expect(screen.getByText(/todavía no se genera/)).toBeInTheDocument();
  });

  it("shows desk 1 its boards, the first semifinal and the final, and nothing else", () => {
    renderDashboard(createTestTournament(), { role: "kof_staff", desk: 1 });

    ["Tablero 1", "Tablero 2", "Semifinal 1", "Final"].forEach((name) => {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    });
    ["Tablero 3", "Tablero 4", "Semifinal 2"].forEach((name) => {
      expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Bitácora" })).not.toBeInTheDocument();
  });

  it("shows desk 2 its boards and the second semifinal", () => {
    renderDashboard(createTestTournament(), { role: "kof_staff", desk: 2 });

    ["Tablero 3", "Tablero 4", "Semifinal 2"].forEach((name) => {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Tablero 1" })).not.toBeInTheDocument();
  });

  it("tells a staff member without a desk to ask for one", () => {
    renderDashboard(createTestTournament(), { role: "kof_staff", desk: null });

    expect(screen.getByText(/todavía no tiene una mesa asignada/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tablero 1" })).not.toBeInTheDocument();
  });

  it("shows the administrator the whole bracket and the log", () => {
    renderDashboard(createTestTournament(), { role: "kof_admin", desk: null });

    ["Tablero 1", "Tablero 2", "Tablero 3", "Tablero 4", "Semifinal 1", "Semifinal 2", "Final", "Bitácora"].forEach(
      (name) => {
        expect(screen.getByRole("heading", { name })).toBeInTheDocument();
      },
    );
  });

  it("shows the sysadmin the whole bracket to watch, with no controls and no log (S37)", () => {
    renderDashboard(createTestTournament(), { role: "sysadmin", desk: null });

    ["Tablero 1", "Tablero 2", "Tablero 3", "Tablero 4", "Semifinal 1", "Semifinal 2", "Final"].forEach((name) => {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Bitácora" })).not.toBeInTheDocument();
    expect(screen.queryByText(/todavía no tiene una mesa asignada/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("counts the matches that the viewer can see", () => {
    renderDashboard(createTestTournament(), { role: "kof_staff", desk: 1 });

    const summary = screen.getByRole("list", { name: "Resumen" });

    expect(within(summary).getByText("Listos").parentElement).toHaveTextContent("16");
  });

  it("monitors the progress and says when no match is being played (S11)", () => {
    renderDashboard(createTestTournament(), { role: "sysadmin", desk: null });

    const monitor = screen.getByRole("region", { name: "En vivo" });

    expect(within(monitor).getByText("0 de 63 combates terminados")).toBeInTheDocument();
    expect(within(monitor).getByText("Pendientes").parentElement).toHaveTextContent("31");
    expect(within(monitor).getByText(/Ningún combate en juego ahora/)).toBeInTheDocument();
  });

  it("lists the matches in play with their players, area and desk (S11)", () => {
    const initial = createTestTournament();
    const busy = applyCommand(initial, { type: "start_match", matchId: getMatch(initial, 33).id }, NOW);
    const [first, second] = getMatchPlayers(busy, getMatch(busy, 33));

    renderDashboard(busy, { role: "sysadmin", desk: null });

    const live = screen.getByRole("list", { name: "Combates en juego y congelados" });

    expect(within(live).getAllByRole("listitem")).toHaveLength(1);
    expect(within(live).getByText("Combate #33")).toBeInTheDocument();
    expect(within(live).getByText(`${first.tag} vs ${second.tag}`)).toBeInTheDocument();
    expect(within(live).getByText("Tablero 3 · Mesa 2")).toBeInTheDocument();
  });

  it("announces the champion when the tournament is over", () => {
    const finished = playUntilFinished(createTestTournament());

    renderDashboard(finished, { role: "kof_admin", desk: null });

    expect(screen.getByRole("status")).toHaveTextContent(/Campeón:/);
  });

  it("shows the new state when the next poll brings a newer bracket", async () => {
    jest.useFakeTimers();

    try {
      const initial = createTestTournament();
      const next = { ...initial, version: 1, phase: "finished" as const, championId: initial.players[0].id };
      const load = jest.fn().mockResolvedValue({ tournament: next, serverNow: 0 });

      renderDashboard(initial, { role: "kof_admin", desk: null }, load);

      expect(screen.queryByText(/Campeón:/)).not.toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByText(/Campeón:/)).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("warns with a toast when the connection is lost but keeps the bracket on screen", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockRejectedValue(new Error("offline"));

      renderDashboard(createTestTournament(), { role: "kof_admin", desk: null }, load);
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
