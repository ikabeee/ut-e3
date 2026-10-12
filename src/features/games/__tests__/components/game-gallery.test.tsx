import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameGallery } from "@features/games/components/game-gallery";
import { getGalleryShots } from "@features/games/lib/game-gallery";
import { GAME_FIXTURES, makeGameFixture } from "@features/games/__tests__/game-fixtures";

const cover = { src: "/mock/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: null };
const game = makeGameFixture({
  ...GAME_FIXTURES[3],
  image: cover,
  gallery: [cover, 1, 2, 3].map((shot) =>
    typeof shot === "number" ? { src: `/mock/games/ruta-9-${shot}.jpg`, alt: `Captura ${shot}`, position: null } : shot,
  ),
});

function renderGallery(shots = getGalleryShots(game)) {
  return render(<GameGallery shots={shots} />);
}

function selectedThumbnail() {
  return screen.getAllByRole("tab").findIndex((tab) => tab.getAttribute("aria-selected") === "true");
}

describe("GameGallery", () => {
  it("shows the cover first with its alternative text", () => {
    renderGallery();

    expect(screen.getByRole("img", { name: "Portada de Ruta 9" })).toBeInTheDocument();
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

  it("shows only the cover, without arrows or thumbnails, when there are no screenshots", () => {
    renderGallery(getGalleryShots(GAME_FIXTURES[0]));

    expect(screen.getByRole("img", { name: GAME_FIXTURES[0].image.alt })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Imagen siguiente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
});
