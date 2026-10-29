import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameGallery } from "@features/games/components/game-gallery";
import type { GameImage } from "@features/games/lib/types";

const IMAGES: GameImage[] = [
  { path: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: 0, isCover: true },
  { path: "/games/ruta-9-1.jpg", alt: "Captura 1", position: 1, isCover: false },
  { path: "/games/ruta-9-2.jpg", alt: "Captura 2", position: 2, isCover: false },
  { path: "/games/ruta-9-3.jpg", alt: "Captura 3", position: 3, isCover: false },
];

function renderGallery(images = IMAGES) {
  return render(<GameGallery images={images} />);
}

function viewerImageAlt() {
  return screen.getByRole("region", { name: "Galería" }).querySelector("img")?.getAttribute("alt");
}

function selectedThumbnail() {
  return screen.getAllByRole("tab").findIndex((tab) => tab.getAttribute("aria-selected") === "true");
}

describe("GameGallery", () => {
  it("opens on the first image, the cover, with its alternative text", () => {
    renderGallery();

    expect(viewerImageAlt()).toBe("Portada de Ruta 9");
    expect(selectedThumbnail()).toBe(0);
  });

  it("shows one thumbnail per image", () => {
    renderGallery();

    expect(screen.getAllByRole("tab")).toHaveLength(IMAGES.length);
  });

  it("moves with the arrows and wraps around at both ends", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("button", { name: "Imagen anterior" }));
    expect(selectedThumbnail()).toBe(3);
    expect(viewerImageAlt()).toBe("Captura 3");

    await user.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(selectedThumbnail()).toBe(0);
    expect(viewerImageAlt()).toBe("Portada de Ruta 9");
  });

  it("shows the image of the thumbnail the visitor selects", async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.click(screen.getByRole("tab", { name: "Imagen 3" }));

    expect(selectedThumbnail()).toBe(2);
    expect(viewerImageAlt()).toBe("Captura 2");
  });

  it("moves between thumbnails with the keyboard arrows and keeps the focus on the selected one", () => {
    renderGallery();

    const firstTab = screen.getByRole("tab", { name: "Imagen 1" });
    fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(selectedThumbnail()).toBe(1);
    expect(screen.getByRole("tab", { name: "Imagen 2" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("tab", { name: "Imagen 2" }), { key: "ArrowLeft" });
    fireEvent.keyDown(screen.getByRole("tab", { name: "Imagen 1" }), { key: "ArrowLeft" });
    expect(selectedThumbnail()).toBe(3);
  });

  it("leaves only the selected thumbnail in the tab order", () => {
    renderGallery();

    const tabIndexes = screen.getAllByRole("tab").map((tab) => tab.getAttribute("tabindex"));

    expect(tabIndexes).toEqual(["0", "-1", "-1", "-1"]);
  });

  it("shows only the image, without arrows or thumbnails, when the game has a single image", () => {
    renderGallery(IMAGES.slice(0, 1));

    expect(viewerImageAlt()).toBe("Portada de Ruta 9");
    expect(screen.queryByRole("button", { name: "Imagen siguiente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Imagen anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
});
