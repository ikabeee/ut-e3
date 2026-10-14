import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamGameManager } from "@features/teams/components/team-game-manager";
import { actionOk } from "@shared/lib/action-result";

describe("TeamGameManager", () => {
  it("renders the game registration form when game is null", () => {
    render(<TeamGameManager game={null} />);

    expect(screen.getByText("Registra el Videojuego de tu Equipo")).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre del videojuego/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sinopsis \/ descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cantidad de jugadores/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enlace a itch\.io/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrar videojuego/i })).toBeInTheDocument();
  });

  it("submits game registration when form is filled and submitted", async () => {
    const user = userEvent.setup();
    const mockCreate = jest.fn().mockResolvedValue(actionOk(undefined));

    render(<TeamGameManager game={null} createAction={mockCreate} />);

    await user.type(screen.getByLabelText(/nombre del videojuego/i), "Super Juego E3");
    await user.type(screen.getByLabelText(/sinopsis \/ descripción/i), "Una aventura épica.");
    await user.clear(screen.getByLabelText(/cantidad de jugadores/i));
    await user.type(screen.getByLabelText(/cantidad de jugadores/i), "2");
    await user.type(screen.getByLabelText(/enlace a itch\.io/i), "https://user.itch.io/game");

    await user.click(screen.getByRole("button", { name: /registrar videojuego/i }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Super Juego E3",
        description: "Una aventura épica.",
        players: "2",
        itchioUrl: "https://user.itch.io/game",
      }),
    );
  });

  it("renders the update form when game exists", () => {
    render(
      <TeamGameManager
        game={{
          id: "game-1",
          name: "Juego Existente",
          slug: "juego-existente",
          description: "Descripción previa",
          itchioUrl: "https://itch.io/existente",
        }}
      />,
    );

    expect(screen.getByText("Juego Existente")).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre del videojuego/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/sinopsis \/ descripción/i)).toHaveValue("Descripción previa");
    expect(screen.getByRole("button", { name: /guardar ficha del juego/i })).toBeInTheDocument();
  });

  it("submits game update when update form is submitted", async () => {
    const user = userEvent.setup();
    const mockUpdate = jest.fn().mockResolvedValue(actionOk(undefined));

    render(
      <TeamGameManager
        game={{
          id: "game-1",
          name: "Juego Existente",
          slug: "juego-existente",
          description: "Descripción previa",
          itchioUrl: "https://itch.io/existente",
        }}
        updateAction={mockUpdate}
      />,
    );

    const descriptionInput = screen.getByLabelText(/sinopsis \/ descripción/i);

    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Nueva descripción editada.");

    await user.click(screen.getByRole("button", { name: /guardar ficha del juego/i }));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Nueva descripción editada.",
      }),
    );
  });
});
