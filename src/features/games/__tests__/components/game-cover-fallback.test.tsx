import { render, screen } from "@testing-library/react";
import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { GameCoverImage } from "@features/games/components/game-cover-image";

describe("GameCoverImage without artwork", () => {
  const game = makeGame({ id: "one-mind", name: "One Mind", images: [] });

  it("shows a generic cover with the name of the game and loads no file", () => {
    render(<GameCoverImage game={game} sizes="100vw" />);

    expect(screen.getByRole("img", { name: "One Mind" })).toHaveTextContent("One Mind");
    expect(document.querySelector("img")).toBeNull();
  });

  it("leaves the name out where the card writes it", () => {
    render(<GameCoverImage game={game} sizes="100vw" isTitleShown={false} />);

    expect(screen.getByRole("img", { name: "One Mind" })).toBeEmptyDOMElement();
  });
});
