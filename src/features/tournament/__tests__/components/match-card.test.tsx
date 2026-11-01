import { render, screen } from "@testing-library/react";
import type { TournamentAction } from "@features/tournament/components/command-button";
import { MatchCard } from "@features/tournament/components/match-card";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import { getMatchPlayers } from "@features/tournament/lib/tournament-view";
import type { Tournament } from "@features/tournament/lib/types";
import {
  createTestTournament,
  freezeAndDisqualify,
  getMatch,
  NOW,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

function renderCard(tournament: Tournament, number: number, who: { canCapture: boolean; isAdmin: boolean }) {
  const match = getMatch(tournament, number);

  render(
    <ul>
      <MatchCard
        match={match}
        players={getMatchPlayers(tournament, match)}
        permissions={who}
        action={action}
        onApplied={jest.fn()}
      />
    </ul>,
  );

  return getMatchPlayers(tournament, match);
}

function startMatch(tournament: Tournament, number: number): Tournament {
  return applyCommand(tournament, { type: "start_match", matchId: getMatch(tournament, number).id }, NOW);
}

const action: TournamentAction = async () => ({ status: "applied" });

describe("MatchCard", () => {
  it("shows the number, the players and the status of a ready match", () => {
    const [first, second] = renderCard(createTestTournament(), 1, { canCapture: true, isAdmin: false });

    expect(screen.getByRole("heading", { name: "Combate #1" })).toBeInTheDocument();
    expect(screen.getByText(first.tag)).toBeInTheDocument();
    expect(screen.getByText(second.tag)).toBeInTheDocument();
    expect(screen.getByText("Listo")).toBeInTheDocument();
  });

  it("lets the desk start a ready match or mark a player as absent", () => {
    const [first] = renderCard(createTestTournament(), 1, { canCapture: true, isAdmin: false });

    expect(screen.getByRole("button", { name: "Iniciar combate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `No se presentó: ${first.tag}` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Congelar" })).not.toBeInTheDocument();
  });

  it("shows no buttons to a desk that does not own the match", () => {
    renderCard(createTestTournament(), 1, { canCapture: false, isAdmin: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("asks which player lost once the match is active", () => {
    const [first, second] = renderCard(startMatch(createTestTournament(), 1), 1, { canCapture: true, isAdmin: false });

    expect(screen.getByRole("button", { name: `Pierde ${first.tag}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Pierde ${second.tag}` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Iniciar combate" })).not.toBeInTheDocument();
    expect(screen.getByText("En juego")).toBeInTheDocument();
  });

  it("gives the administrator the freeze button on a ready or active match", () => {
    renderCard(createTestTournament(), 1, { canCapture: true, isAdmin: true });

    expect(screen.getByRole("button", { name: "Congelar" })).toBeInTheDocument();
  });

  it("tells a desk that a frozen match belongs to the administrator", () => {
    const frozen = applyCommand(
      createTestTournament(),
      { type: "freeze_match", matchId: getMatch(createTestTournament(), 1).id },
      NOW,
    );

    renderCard(frozen, 1, { canCapture: false, isAdmin: false });

    expect(screen.getByText("Congelado: solo el administrador de KOF lo resuelve.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets the administrator unfreeze or disqualify one or both players of a frozen match", () => {
    const base = createTestTournament();
    const frozen = applyCommand(base, { type: "freeze_match", matchId: getMatch(base, 1).id }, NOW);
    const [first, second] = renderCard(frozen, 1, { canCapture: true, isAdmin: true });

    expect(screen.getByRole("button", { name: "Descongelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Descalificar a ${first.tag}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Descalificar a ${second.tag}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descalificar a los dos" })).toBeInTheDocument();
  });

  it("shows who won a match that was played and offers nothing more", () => {
    const [winner] = renderCard(startAndFinish(createTestTournament(), 1, 1), 1, { canCapture: true, isAdmin: true });

    expect(screen.getByText("Ganó")).toBeInTheDocument();
    expect(screen.getByText(winner.tag)).toBeInTheDocument();
    expect(screen.getByText("Terminado")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets only the administrator revert a disqualification", () => {
    const disqualified = freezeAndDisqualify(createTestTournament(), 1, [0]);

    renderCard(disqualified, 1, { canCapture: true, isAdmin: false });

    expect(screen.queryByRole("button", { name: "Revertir resultado" })).not.toBeInTheDocument();
  });

  it("offers the administrator to revert a disqualification", () => {
    const disqualified = freezeAndDisqualify(createTestTournament(), 1, [0]);

    renderCard(disqualified, 1, { canCapture: true, isAdmin: true });

    expect(screen.getByRole("button", { name: "Revertir resultado" })).toBeInTheDocument();
    expect(screen.getByText("Descalificación")).toBeInTheDocument();
  });

  it("shows a match that waits for its players as pending, with no buttons", () => {
    renderCard(createTestTournament(), 9, { canCapture: true, isAdmin: true });

    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getAllByText("Por definir")).toHaveLength(2);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
