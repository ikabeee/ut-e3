import { render, screen } from "@testing-library/react";
import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { GameDetailHeader } from "@features/games/components/game-detail-header";

const game = makeGame({
  id: "ruta-9",
  name: "Ruta 9",
  genre: { id: "racing", name: "Carreras", slug: "racing" },
  stand: { zone: "A", number: 3 },
});

function renderHeader(catalogHref = "/games") {
  render(<GameDetailHeader game={game} catalogHref={catalogHref} />);
}

describe("GameDetailHeader", () => {
  it("shows a back arrow in the foreground color with a 44px target", () => {
    renderHeader();

    const backLink = screen.getByRole("link", { name: "Todos los juegos" });

    expect(backLink.textContent).toMatch(/←/);
    expect(backLink).not.toHaveClass("text-muted");
    expect(backLink).toHaveClass("touch-target");
  });

  it("links back to the catalog by its accessible name", () => {
    renderHeader("/games?genre=racing");

    expect(screen.getByRole("link", { name: "Todos los juegos" })).toHaveAttribute("href", "/games?genre=racing");
  });

  it("keeps heading the page with the name, the genre and the short stand code", () => {
    renderHeader();

    expect(screen.getByRole("heading", { level: 1, name: "Ruta 9" })).toBeInTheDocument();
    expect(screen.getByText("Carreras · ZA-S3")).toBeInTheDocument();
  });
});
