import { render, screen, within } from "@testing-library/react";
import { BracketTree } from "@features/tournament/components/bracket-tree";
import type { CurrentPlayback } from "@features/tournament/hooks/use-bracket-playback";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { createTestTournament, startAndFinish } from "@features/tournament/__tests__/tournament-test-utils";

const decided = toPublicBracket(startAndFinish(createTestTournament(), 1, 1));

function matchGroup(number: number): HTMLElement {
  return screen.getByRole("group", { name: new RegExp(`^Combate #${number}:`) });
}

function playing(phase: CurrentPlayback["phase"]): CurrentPlayback {
  return { number: 1, winnerSlot: 0, advance: { number: 9, slot: 0 }, phase };
}

describe("BracketTree animations (S8)", () => {
  it("strikes the loser through in red and leaves the winner alone", () => {
    render(<BracketTree bracket={decided} />);

    const [winner, loser] = within(matchGroup(1)).getAllByTitle(/.+/);

    expect(loser).toHaveAttribute("data-result", "loser");
    expect(loser).toHaveClass("text-danger", "line-through");
    expect(winner).toHaveAttribute("data-result", "winner");
    expect(winner).not.toHaveClass("line-through");
  });

  it("does not strike through a place that is still open or a bye", () => {
    render(<BracketTree bracket={toPublicBracket(createTestTournament(40))} />);

    expect(document.querySelectorAll("[data-result='loser']")).toHaveLength(0);
  });

  it("marks the match the show is approaching, and no other", () => {
    render(<BracketTree bracket={decided} playback={playing("approach")} />);

    expect(matchGroup(1)).toHaveAttribute("data-playback", "approach");
    expect(document.querySelectorAll("[data-playback]")).toHaveLength(1);
  });

  it("lights the box of the winner while the result is decided", () => {
    render(<BracketTree bracket={decided} playback={playing("decide")} />);

    expect(matchGroup(1)).toHaveAttribute("data-playback", "decide");
  });

  it("marks the place in the next round where the winner arrives, only that one", () => {
    render(<BracketTree bracket={decided} playback={playing("advance")} />);

    const arriving = document.querySelectorAll("[data-playback='arrive']");

    expect(arriving).toHaveLength(1);
    expect(matchGroup(9).contains(arriving[0])).toBe(true);
    expect(arriving[0]).toBe(matchGroup(9).querySelectorAll("div[title]")[0]);
  });

  it("zooms the camera into the match that is playing and out when nothing is left", () => {
    const { rerender } = render(<BracketTree bracket={decided} playback={playing("approach")} />);
    const stage = screen.getByRole("group", { name: "Bracket en forma de árbol" });

    expect(stage).toHaveAttribute("data-camera", "in");
    expect(stage.style.transform).toBe("scale(2.2)");

    rerender(<BracketTree bracket={decided} playback={playing("advance")} />);

    expect(stage.style.transform).toBe("scale(1.7)");

    rerender(<BracketTree bracket={decided} playback={null} />);

    expect(stage).toHaveAttribute("data-camera", "out");
    expect(stage.style.transform).toBe("scale(1)");
  });

  it("scrolls the match into view when the show approaches it", () => {
    const scroll = jest.fn();

    Element.prototype.scrollIntoView = scroll;
    render(<BracketTree bracket={decided} playback={playing("approach")} />);

    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "center", inline: "center" });
  });

  it("draws nothing special when nothing is playing", () => {
    render(<BracketTree bracket={decided} playback={null} />);

    expect(document.querySelectorAll("[data-playback]")).toHaveLength(0);
  });
});
