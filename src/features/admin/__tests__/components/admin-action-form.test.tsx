import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { actionError, actionOk, type FormAction } from "@shared/lib/action-result";

function renderForm(action: FormAction<unknown>) {
  return render(
    <AdminActionForm action={action} submitLabel="Crear equipo" successMessage="Equipo creado." resetOnSuccess>
      <AdminTextField name="name" label="Nombre" />
    </AdminActionForm>,
  );
}

describe("AdminActionForm", () => {
  it("sends the fields to the action and confirms it", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue(actionOk(undefined));
    renderForm(action);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Equipo Grava");
    await user.click(screen.getByRole("button", { name: "Crear equipo" }));

    expect(action).toHaveBeenCalledWith({ name: "Equipo Grava" });
    expect(await screen.findByRole("status")).toHaveTextContent("Equipo creado.");
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("");
  });

  it("shows the error of each field and the general error", async () => {
    const user = userEvent.setup();

    const action = jest
      .fn()
      .mockResolvedValue(actionError("Revisa los campos marcados.", { name: "El nombre es obligatorio." }));

    renderForm(action);

    await user.click(screen.getByRole("button", { name: "Crear equipo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Revisa los campos marcados.");
    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("clears the error of a field as soon as it is edited, before the next submit", async () => {
    const user = userEvent.setup();

    const action = jest
      .fn()
      .mockResolvedValue(actionError("Revisa los campos marcados.", { name: "El nombre es obligatorio." }));

    renderForm(action);

    await user.click(screen.getByRole("button", { name: "Crear equipo" }));
    await screen.findByText("El nombre es obligatorio.");
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "E");

    expect(screen.queryByText("El nombre es obligatorio.")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
