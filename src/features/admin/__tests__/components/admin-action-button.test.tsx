import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { actionError, actionOk } from "@shared/lib/action-result";

describe("AdminActionButton", () => {
  it("asks for confirmation before running the action", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue(actionOk(undefined));
    render(<AdminActionButton action={action} label="Borrar" confirmLabel="Sí, borrar" />);

    await user.click(screen.getByRole("button", { name: "Borrar" }));
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Borrar" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Borrar" }));
    await user.click(screen.getByRole("button", { name: "Sí, borrar" }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("shows the error returned by the action", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue(actionError("El equipo ya no existe."));
    render(<AdminActionButton action={action} label="Marcar avisado" />);

    await user.click(screen.getByRole("button", { name: "Marcar avisado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El equipo ya no existe.");
  });
});
