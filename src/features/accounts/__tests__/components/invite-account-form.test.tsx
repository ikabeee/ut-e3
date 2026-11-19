import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteAccountForm, type ManagementAction } from "@features/accounts/components/invite-account-form";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const ADMIN_ROLES = [
  { value: "kof_admin", label: "Administrador de KOF" },
  { value: "raffle_admin", label: "Administrador de rifa" },
  { value: "help_desk", label: "Atención" },
];

const STAFF_ROLES = [{ value: "kof_staff", label: "Staff de KOF" }];

const EVERY_ROLE = [
  { value: "help_desk", label: "Atención" },
  { value: "kof_staff", label: "Staff de KOF" },
  { value: "stand_staff", label: "Staff de stand" },
];

const STANDS = [{ value: "stand-1", label: "ZA-S1" }];

describe("InviteAccountForm", () => {
  it("sends the name, the email and the first role of the list", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Invitación enviada." });

    renderWithToasts(<InviteAccountForm roles={ADMIN_ROLES} showDesk={false} action={action} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Ana Pérez");
    await userEvent.type(screen.getByLabelText("Correo"), "ana@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("name")).toBe("Ana Pérez");
    expect(received[0].get("email")).toBe("ana@ut.mx");
    expect(received[0].get("role")).toBe("kof_admin");
    expect(received[0].get("desk")).toBeNull();
  });

  it("sends the only role without asking for it, and the desk, for the staff of the desks", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Invitación enviada." });

    renderWithToasts(<InviteAccountForm roles={STAFF_ROLES} showDesk action={action} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Luis");
    await userEvent.type(screen.getByLabelText("Correo"), "luis@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(screen.queryByLabelText("Rol")).not.toBeInTheDocument();
    expect(received[0].get("role")).toBe("kof_staff");
    expect(received[0].get("desk")).toBe("1");
  });

  it("offers the four desks, one for each board, and sends the one that was chosen", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Invitación enviada." });

    renderWithToasts(<InviteAccountForm roles={STAFF_ROLES} showDesk action={action} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Luis");
    await userEvent.type(screen.getByLabelText("Correo"), "luis@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: /Mesa/ }));

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Mesa 1",
      "Mesa 2",
      "Mesa 3",
      "Mesa 4",
    ]);

    await userEvent.click(screen.getByRole("option", { name: "Mesa 4" }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("desk")).toBe("4");
  });

  it("asks for the stand of a stand role, and sends the one that was chosen", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Invitación enviada." });

    renderWithToasts(
      <InviteAccountForm roles={EVERY_ROLE} defaultRole="stand_staff" showDesk stands={STANDS} action={action} />,
    );
    await userEvent.type(screen.getByLabelText("Nombre"), "Eva");
    await userEvent.type(screen.getByLabelText("Correo"), "eva@ut.mx");

    expect(screen.queryByText("Mesa")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("role")).toBe("stand_staff");
    expect(received[0].get("standId")).toBe("stand-1");
    expect(received[0].get("desk")).toBeNull();
  });

  it("asks for the desk only while the KOF staff is the chosen role", async () => {
    const { received, action } = recordingAction({ status: "done", message: "Invitación enviada." });

    renderWithToasts(
      <InviteAccountForm roles={EVERY_ROLE} defaultRole="kof_staff" showDesk stands={STANDS} action={action} />,
    );
    await userEvent.type(screen.getByLabelText("Nombre"), "Luis");
    await userEvent.type(screen.getByLabelText("Correo"), "luis@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("desk")).toBe("1");
    expect(received[0].get("standId")).toBeNull();
  });

  it("confirms what the server did and clears the fields", async () => {
    const { action } = recordingAction({ status: "done", message: "Invitación enviada." });

    renderWithToasts(<InviteAccountForm roles={ADMIN_ROLES} showDesk={false} action={action} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
    await userEvent.type(screen.getByLabelText("Correo"), "ana@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Invitación enviada.");
    await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveValue(""));
  });

  it("shows why the server refused and keeps what was typed", async () => {
    const { action } = recordingAction({ status: "error", message: "Ese correo ya tiene una cuenta." });

    renderWithToasts(<InviteAccountForm roles={ADMIN_ROLES} showDesk={false} action={action} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
    await userEvent.type(screen.getByLabelText("Correo"), "ana@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ese correo ya tiene una cuenta.");
    expect(screen.getByLabelText("Correo")).toHaveValue("ana@ut.mx");
  });
});

function recordingAction(result: ManagementActionState) {
  const received: FormData[] = [];

  const action: ManagementAction = async (_previous, form) => {
    received.push(form);

    return result;
  };

  return { received, action };
}
