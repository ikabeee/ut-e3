import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameCoverflow } from "@features/games/components/game-coverflow";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderCoverflow() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(gamesQueryKeys.list(), [...MOCK_GAMES]);

  return render(
    <QueryClientProvider client={queryClient}>
      <GameCoverflow />
    </QueryClientProvider>,
  );
}

function currentCase() {
  return screen.getAllByRole("link").find((link) => link.getAttribute("aria-current") === "true");
}

describe("GameCoverflow", () => {
  it("shows the middle game in front and links every case to its page", () => {
    renderCoverflow();

    expect(currentCase()).toHaveAccessibleName("Marea Roja, Estrategia, stand A5");
    expect(currentCase()).toHaveAttribute("href", "/games/marea-roja");
  });

  it("brings a side case to the front instead of opening it", async () => {
    const user = userEvent.setup();
    renderCoverflow();

    await user.click(screen.getByRole("link", { name: /^Turbina/ }));

    expect(currentCase()).toHaveAccessibleName("Turbina, Carreras, stand A9");
  });

  it("stops at the first and last game", async () => {
    const user = userEvent.setup();
    renderCoverflow();

    for (let step = 0; step < 12; step += 1) {
      await user.click(screen.getByRole("button", { name: "Juego siguiente" }));
    }

    expect(currentCase()).toHaveAccessibleName("Circuito 7, Puzle, stand B9");
    expect(screen.getByRole("button", { name: "Juego siguiente" })).toBeDisabled();
  });

  it("moves with the keyboard arrows", () => {
    renderCoverflow();

    fireEvent.keyDown(currentCase() as HTMLElement, { key: "ArrowLeft" });

    expect(currentCase()).toHaveAccessibleName("Templo 404, Metroidvania, stand B4");
    expect(currentCase()).toHaveFocus();
  });
});
