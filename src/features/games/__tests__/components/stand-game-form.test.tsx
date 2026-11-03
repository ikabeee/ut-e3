import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StandGameForm, type StandGameAction } from "@features/games/components/stand-game-form";
import { GAMES_COPY } from "@features/games/lib/games-copy";

const COPY = GAMES_COPY.standGame;

const GENRES = [
  { id: "genre-1", name: "Acción", slug: "accion" },
  { id: "genre-2", name: "Puzle", slug: "puzle" },
];

describe("StandGameForm", () => {
  it("starts empty while the stand has no game", () => {
    render(<StandGameForm game={null} genres={GENRES} action={recordingAction([]).action} />);

    expect(screen.getByLabelText(COPY.fields.name)).toHaveValue("");
    expect(screen.getByLabelText(COPY.fields.synopsis)).toHaveValue("");
  });

  it("starts with the registered game", () => {
    const game = { name: "Ruta 9", synopsis: "Carreras.", genreId: "genre-2", itchUrl: "https://a.itch.io/ruta" };

    render(<StandGameForm game={game} genres={GENRES} action={recordingAction([]).action} />);

    expect(screen.getByLabelText(COPY.fields.name)).toHaveValue("Ruta 9");
    expect(screen.getByLabelText(COPY.fields.synopsis)).toHaveValue("Carreras.");
    expect(screen.getByLabelText(COPY.fields.itchUrl)).toHaveValue("https://a.itch.io/ruta");
  });

  it("has no field for images or for the stand, and says who loads the images", () => {
    const { container } = render(<StandGameForm game={null} genres={GENRES} action={recordingAction([]).action} />);

    expect(container.querySelector("input[type=file]")).toBeNull();
    expect(container.querySelector("[name=standId]")).toBeNull();
    expect(screen.getByText(COPY.coverNote)).toBeInTheDocument();
  });

  it("posts the fields and keeps what was typed after the server accepted them", async () => {
    const { received, action } = recordingAction([{ status: "done", message: COPY.outcomes.created }]);

    render(<StandGameForm game={null} genres={GENRES} action={action} />);
    await userEvent.type(screen.getByLabelText(COPY.fields.name), "Ruta 9");
    await userEvent.type(screen.getByLabelText(COPY.fields.synopsis), "Carreras.");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("name")).toBe("Ruta 9");
    expect(received[0].get("synopsis")).toBe("Carreras.");
    expect(received[0].get("genreId")).toBe("genre-1");
    expect(await screen.findByRole("status")).toHaveTextContent(COPY.outcomes.created);
    expect(screen.getByLabelText(COPY.fields.name)).toHaveValue("Ruta 9");
  });

  it("shows what the server refused", async () => {
    const { action } = recordingAction([{ status: "error", message: COPY.errors.itchInvalid }]);

    render(<StandGameForm game={null} genres={GENRES} action={action} />);
    await userEvent.type(screen.getByLabelText(COPY.fields.name), "Ruta 9");
    await userEvent.type(screen.getByLabelText(COPY.fields.synopsis), "Carreras.");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(COPY.errors.itchInvalid);
  });
});

function recordingAction(answers: Awaited<ReturnType<StandGameAction>>[]) {
  const received: FormData[] = [];

  const action: StandGameAction = async (_previous, form) => {
    received.push(form);

    return answers[received.length - 1] ?? { status: "done", message: "" };
  };

  return { received, action };
}
