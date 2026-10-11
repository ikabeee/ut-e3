import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameGallery } from "@features/games/components/game-gallery";
import { getGalleryShots } from "@features/games/lib/game-gallery";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

const game = MOCK_GAMES[3];

function renderGallery() {
  return render(
    <GameGallery
      gameName={game.name}
      shots={getGalleryShots(game, MOCK_GAMES.length)}
      labels={{ stand: game.stand, genre: game.genre, members: game.members }}
    />,
  );
}

function selectedThumbnail() {
  return screen.getAllByRole("tab").findIndex((tab) => tab.getAttribute("aria-selected") === "true");
}

describe("GameGallery", () => {
  it("shows the cover first with the game name as alternative text", () => {
    renderGallery();

    expect(screen.getByRole("img", { name: game.name })).toBeInTheDocument();
    expect(selectedThumbnail()).toBe(0);
  });

  it("moves with the arrows and wraps around", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("button", { name: "Imagen anterior" }));
    expect(selectedThumbnail()).toBe(3);

    await user.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(selectedThumbnail()).toBe(0);
  });

  it("selects a shot from its thumbnail", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("tab", { name: "Imagen 3" }));

    expect(selectedThumbnail()).toBe(2);
  });

  it("responds to the keyboard arrows", () => {
    renderGallery();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(selectedThumbnail()).toBe(2);
  });
});
