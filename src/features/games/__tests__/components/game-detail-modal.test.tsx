import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameDetailModal } from "@features/games/components/game-detail-modal";

function renderModal(onClose: () => void) {
  render(
    <GameDetailModal title="Ruta 9" onClose={onClose}>
      <p>Carreras arcade por la costa de Quintana Roo.</p>
    </GameDetailModal>,
  );
}

describe("GameDetailModal", () => {
  it("shows the game in a dialog named after it", () => {
    renderModal(jest.fn());

    const dialog = screen.getByRole("dialog", { name: "Ruta 9" });

    expect(dialog).toHaveTextContent("Carreras arcade por la costa de Quintana Roo.");
  });

  it("closes with the Cerrar button", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal(onClose);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the Escape key", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal(onClose);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
