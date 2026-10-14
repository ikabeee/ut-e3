import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamCreateForm } from "@features/admin/components/team-create-form";
import { actionOk } from "@shared/lib/action-result";

describe("TeamCreateForm", () => {
  it("renders team fields and initial leader fields", () => {
    render(<TeamCreateForm action={jest.fn()} />);

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Stand")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre completo del líder")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo institucional")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear equipo" })).toBeInTheDocument();
  });

  it("submits team and initial leader data", async () => {
    const user = userEvent.setup();

    const action = jest.fn().mockResolvedValue(
      actionOk({
        team: {
          id: "team-1",
          name: "Equipo Fénix",
          standCode: "A1",
          members: [],
          gameSlug: null,
        },
        scannerKey: "secret-key-12345",
      }),
    );

    render(<TeamCreateForm action={action} />);

    await user.type(screen.getByLabelText("Nombre"), "Equipo Fénix");
    await user.type(screen.getByLabelText("Stand"), "A1");
    await user.type(screen.getByLabelText("Nombre completo del líder"), "Ana López");
    await user.type(screen.getByLabelText("Correo institucional"), "alopez@ute3.edu.mx");
    await user.click(screen.getByRole("button", { name: "Crear equipo" }));

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Equipo Fénix",
        standCode: "A1",
        leaderFullName: "Ana López",
        leaderEmail: "alopez@ute3.edu.mx",
      }),
    );
  });
});
