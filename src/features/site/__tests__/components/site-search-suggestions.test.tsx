import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteSearchForm } from "@features/site/components/site-search-form";
import type { GameSuggestion } from "@features/games/lib/types";

const GAMES: GameSuggestion[] = [
  { slug: "turno-rosso", name: "Turno Rosso", genreName: "Simulación" },
  { slug: "saatan-paal", name: "Saatal Paal", genreName: "Sigilo" },
  { slug: "santuario", name: "Santuario", genreName: "Acción" },
];

function renderForm(onSubmit?: () => void) {
  const loadGames = jest.fn(async () => GAMES);

  render(<SiteSearchForm loadGames={loadGames} onSubmit={onSubmit} />);

  return { input: screen.getByRole("combobox", { name: "Busca un juego" }), loadGames };
}

describe("SiteSearchForm suggestions (S21)", () => {
  it("is a closed combobox that loads no games until something is typed", () => {
    const { input, loadGames } = renderForm();

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(loadGames).not.toHaveBeenCalled();
  });

  it('suggests "Saatal Paal" for "san", after the games that contain the text, linking to each game', async () => {
    const { input, loadGames } = renderForm();

    await userEvent.type(input, "san");

    const listbox = await screen.findByRole("listbox", { name: "Juegos sugeridos" });
    const options = within(listbox).getAllByRole("option");

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(options.map((option) => option.textContent)).toEqual(["SantuarioAcción", "Saatal PaalSigilo"]);
    expect(options[1]).toHaveAttribute("href", "/games/saatan-paal");
    expect(options[1]).toHaveClass("min-h-11");
    expect(screen.getByRole("status")).toHaveTextContent("2 juegos");
    expect(loadGames).toHaveBeenCalledTimes(1);
  });

  it("moves through the options with the arrow keys and wraps around", async () => {
    const { input } = renderForm();

    await userEvent.type(input, "san");
    await screen.findByRole("listbox");
    const options = screen.getAllByRole("option");

    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);

    await userEvent.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
  });

  it("opens the active game with Enter instead of sending the search", async () => {
    const onSubmit = jest.fn();
    const { input } = renderForm(onSubmit);
    const clicks: string[] = [];

    await userEvent.type(input, "san");
    await screen.findByRole("listbox");
    screen.getAllByRole("option")[1].addEventListener("click", (event) => {
      event.preventDefault();
      clicks.push("saatan-paal");
    });

    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(clicks).toEqual(["saatan-paal"]);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the suggestions with Escape and keeps the typed text", async () => {
    const { input } = renderForm();

    await userEvent.type(input, "san");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveValue("san");
  });

  it("says that no game matches and that Buscar opens the catalog", async () => {
    const { input } = renderForm();

    await userEvent.type(input, "zzz");

    expect(await screen.findByText("Ningún juego coincide. Presiona Buscar para ver el catálogo.")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("keeps the plain GET search to /games?q= for Enter without an active game", () => {
    const { input } = renderForm();
    const form = screen.getByRole("search", { name: "Buscar juegos" });

    expect(form).toHaveAttribute("action", "/games");
    expect(form).toHaveAttribute("method", "get");
    expect(input).toHaveAttribute("name", "q");
    expect(input).toHaveAttribute("type", "search");
  });
});
