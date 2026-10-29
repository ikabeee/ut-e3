import { render, screen, within } from "@testing-library/react";
import { BracketTree } from "@features/tournament/components/bracket-tree";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import {
  createTestTournament,
  getMatch,
  NOW,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

type TestTournament = ReturnType<typeof createTestTournament>;

function renderTree(tournament: TestTournament) {
  return render(<BracketTree bracket={toPublicBracket(tournament)} />);
}

function matchGroup(number: number): HTMLElement {
  return screen.getByRole("group", { name: new RegExp(`^Combate #${number}:`) });
}

describe("BracketTree (S7)", () => {
  it("draws the 63 matches of the bracket", () => {
    renderTree(createTestTournament());

    expect(screen.getAllByRole("group", { name: /^Combate #\d+:/ })).toHaveLength(63);
    expect(screen.getByRole("group", { name: "Bracket en forma de árbol" })).toBeInTheDocument();
  });

  it("labels the columns from the outside in, mirrored, with the final in the middle", () => {
    renderTree(createTestTournament());

    expect(screen.getAllByText("Ronda 1")).toHaveLength(2);
    expect(screen.getAllByText("Ronda 3")).toHaveLength(2);
    expect(screen.getAllByText("Final de tablero")).toHaveLength(2);
    expect(screen.getAllByText("Semifinal")).toHaveLength(2);
    expect(screen.getAllByText("Final")).toHaveLength(1);
  });

  it("reads each match as who plays whom, for assistive technology", () => {
    renderTree(createTestTournament());

    expect(matchGroup(1).getAttribute("aria-label")).toMatch(/^Combate #1: Tag\d+ contra Tag\d+$/);
    expect(matchGroup(63).getAttribute("aria-label")).toBe("Combate #63: Por definir contra Por definir");
  });

  it("keeps the status of each match, so the match in play can be highlighted", () => {
    const base = createTestTournament();
    const started = applyCommand(base, { type: "start_match", matchId: getMatch(base, 5).id }, NOW);

    renderTree(started);

    expect(matchGroup(5)).toHaveAttribute("data-status", "active");
    expect(matchGroup(6)).toHaveAttribute("data-status", "ready");
    expect(matchGroup(9)).toHaveAttribute("data-status", "pending");
  });

  it("marks the winner of a match that finished and the one that lost", () => {
    renderTree(startAndFinish(createTestTournament(), 1, 1));

    const group = matchGroup(1);

    expect(within(group).getAllByText("Ganó")).toHaveLength(1);
    expect(group).toHaveAttribute("data-status", "finished");
  });

  it("shows a bye as BYE and a place that is still open as pending", () => {
    renderTree(createTestTournament(40));

    expect(screen.getAllByText("BYE")).toHaveLength(24);
    expect(screen.getAllByText("Por definir").length).toBeGreaterThan(0);
  });

  it("hides the connecting lines from assistive technology", () => {
    const { container } = renderTree(createTestTournament());

    const lines = container.querySelectorAll("[data-connector]");

    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => expect(line).toHaveAttribute("aria-hidden", "true"));
  });

  it("never shows an identifier, only gamertags", () => {
    const { container } = renderTree(createTestTournament());

    expect(container.innerHTML).not.toContain("player-");
    expect(container.innerHTML).not.toContain("match-");
  });
});
