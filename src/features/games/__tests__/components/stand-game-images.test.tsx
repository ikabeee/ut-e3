import { render, screen, within } from "@testing-library/react";
import { StandGameImages } from "@features/games/components/stand-game-images";
import { GENERIC_COVER_PATH } from "@features/games/lib/game-cover";
import { GAMES_COPY } from "@features/games/lib/games-copy";

const COPY = GAMES_COPY.standGame.images;

const action = async () => ({ status: "done" as const, message: "" });

const CARD = { path: "/api/media/games/ruta-9-abcd1234.jpg", alt: "Portada", position: 1, isCover: true };

const SCREENSHOT = {
  path: "/api/media/games/ruta-9-captura-01-abcd1234.jpg",
  alt: "Captura",
  position: 3,
  isCover: false,
};

describe("StandGameImages", () => {
  it("asks to save the game first while the stand has none", () => {
    render(<StandGameImages game={null} uploadAction={action} deleteAction={action} />);

    expect(screen.getByText(COPY.needsGame)).toBeInTheDocument();
  });

  it("lists the six slots with the file name and the size of the grid, and counts the required ones", () => {
    const game = { name: "Ruta 9", slug: "ruta-9", images: [CARD] };

    render(<StandGameImages game={game} uploadAction={action} deleteAction={action} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText(COPY.checklist(1, 2))).toBeInTheDocument();
    expect(screen.getByText(/ruta-9\.jpg · JPG, sRGB, 810x1080 px/)).toBeInTheDocument();
    expect(screen.getByText(/ruta-9-portada\.jpg · JPG, sRGB, 1920x1080 px/)).toBeInTheDocument();
    expect(screen.getByText(/ruta-9-captura-04\.jpg/)).toBeInTheDocument();
  });

  it("counts the generic cover of a new game as missing", () => {
    const generic = { ...CARD, path: GENERIC_COVER_PATH };

    render(
      <StandGameImages
        game={{ name: "Ruta 9", slug: "ruta-9", images: [generic] }}
        uploadAction={action}
        deleteAction={action}
      />,
    );

    expect(screen.getByText(COPY.checklist(0, 2))).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("accepts only JPEG files in each file field", () => {
    const { container } = render(
      <StandGameImages
        game={{ name: "Ruta 9", slug: "ruta-9", images: [] }}
        uploadAction={action}
        deleteAction={action}
      />,
    );

    const inputs = container.querySelectorAll("input[type=file]");

    expect(inputs).toHaveLength(6);
    inputs.forEach((input) => expect(input).toHaveAttribute("accept", "image/jpeg"));
  });

  it("offers to remove a screenshot that is loaded but not the card", () => {
    const game = { name: "Ruta 9", slug: "ruta-9", images: [CARD, SCREENSHOT] };

    render(<StandGameImages game={game} uploadAction={action} deleteAction={action} />);

    const items = screen.getAllByRole("listitem");

    expect(within(items[0]).queryByRole("button", { name: COPY.remove })).toBeNull();
    expect(within(items[2]).getByRole("button", { name: COPY.remove })).toBeInTheDocument();
    expect(within(items[2]).getByRole("button", { name: COPY.replace })).toBeInTheDocument();
    expect(within(items[2]).getByRole("img")).toBeInTheDocument();
  });
});
