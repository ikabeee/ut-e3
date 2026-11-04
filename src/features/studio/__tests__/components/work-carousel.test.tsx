import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { WorkCarousel } from "@features/studio/components/work-carousel";

const games = makeGames(6);

function gameLinks() {
  return within(screen.getByRole("list", { name: "Juegos" })).getAllByRole("link");
}

describe("WorkCarousel", () => {
  beforeEach(() => {
    Element.prototype.scrollTo = () => undefined;
  });

  it("shows every game by default", () => {
    render(<WorkCarousel games={games} />);

    expect(gameLinks()).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("6 juegos")).toBeInTheDocument();
  });

  it("filters by genre and clears the filter when the genre is pressed again", async () => {
    const user = userEvent.setup();
    render(<WorkCarousel games={games} />);

    await user.click(screen.getByRole("button", { name: "Puzle" }));
    expect(gameLinks()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Puzle" }));
    expect(gameLinks()).toHaveLength(6);
  });
});
