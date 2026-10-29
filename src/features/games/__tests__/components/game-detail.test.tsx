import { render, screen, within } from "@testing-library/react";
import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { GameDetail } from "@features/games/components/game-detail";
import type { GameImage } from "@features/games/lib/types";

const cover: GameImage = { path: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: 2, isCover: true };

const pits: GameImage = { path: "/games/ruta-9-pits.jpg", alt: "Ruta 9: pits", position: 1, isCover: false };

const game = makeGame({
  id: "ruta-9",
  name: "Ruta 9",
  synopsis: "Carreras arcade por la costa de Quintana Roo.",
  genre: { id: "racing", name: "Carreras", slug: "racing" },
  stand: { zone: "A", number: 3 },
  images: [pits, cover],
});

function renderDetail() {
  render(<GameDetail game={game} itchLink={<p>itch slot</p>} />);
}

describe("GameDetail", () => {
  it("shows the name, synopsis and genre of the game", () => {
    renderDetail();

    expect(screen.getByRole("heading", { level: 1, name: "Ruta 9" })).toBeInTheDocument();
    expect(screen.getByText("Carreras arcade por la costa de Quintana Roo.")).toBeInTheDocument();
    expect(screen.getByText("Carreras")).toBeInTheDocument();
  });

  it("shows only the short stand code", () => {
    renderDetail();

    expect(screen.getByText("ZA-S3")).toBeInTheDocument();
    expect(screen.queryByText(/ZA-S3-E/)).not.toBeInTheDocument();
  });

  it("shows the gallery with the cover first", () => {
    renderDetail();

    const gallery = screen.getByRole("list", { name: "Galería" });
    const images = within(gallery).getAllByRole("img");

    expect(images.map((image) => image.getAttribute("alt"))).toEqual(["Portada de Ruta 9", "Ruta 9: pits"]);
  });

  it("renders the itch.io slot", () => {
    renderDetail();

    expect(screen.getByText("itch slot")).toBeInTheDocument();
  });
});
