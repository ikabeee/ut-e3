import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import { ManagedAccountList } from "@features/accounts/components/managed-account-list";
import type { ManagedAccount } from "@features/accounts/lib/types";

const INVITED: ManagedAccount = {
  id: "invited-1",
  name: "Ana Pérez",
  email: "ana@ut.mx",
  role: "kof_admin",
  status: "invited",
  kofDesk: null,
};

const ACTIVE: ManagedAccount = {
  id: "active-1",
  name: "Luis Gómez",
  email: "luis@ut.mx",
  role: "kof_staff",
  status: "active",
  kofDesk: 2,
};

const DISABLED: ManagedAccount = {
  ...ACTIVE,
  id: "disabled-1",
  name: "Eva Ruiz",
  email: "eva@ut.mx",
  status: "disabled",
};

describe("ManagedAccountList", () => {
  it("says so when there are no accounts", () => {
    renderList([]);

    expect(screen.getByText("Todavía no hay cuentas.")).toBeInTheDocument();
  });

  it("shows the name, email, role, desk and status of each account", () => {
    renderList([INVITED, ACTIVE, DISABLED]);

    const invited = rowOf("Ana Pérez");
    const active = rowOf("Luis Gómez");

    expect(invited).toHaveTextContent("ana@ut.mx");
    expect(invited).toHaveTextContent("Administrador de KOF");
    expect(invited).toHaveTextContent("Invitación pendiente");
    expect(active).toHaveTextContent("Staff de KOF");
    expect(active).toHaveTextContent("Mesa 2");
    expect(active).toHaveTextContent("Activa");
    expect(rowOf("Eva Ruiz")).toHaveTextContent("Desactivada");
  });

  it("offers to resend and to disable an invitation that is pending", () => {
    renderList([INVITED]);

    expect(within(rowOf("Ana Pérez")).getByRole("button", { name: "Reenviar invitación" })).toBeInTheDocument();
    expect(within(rowOf("Ana Pérez")).getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
  });

  it("offers only to disable an active account, and nothing for one that is disabled", () => {
    renderList([ACTIVE, DISABLED]);

    expect(within(rowOf("Luis Gómez")).queryByRole("button", { name: "Reenviar invitación" })).not.toBeInTheDocument();
    expect(within(rowOf("Luis Gómez")).getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
    expect(within(rowOf("Eva Ruiz")).queryByRole("button")).not.toBeInTheDocument();
  });

  it("sends the id of the account to resend", async () => {
    const { calls, resend, disable } = recordingActions();

    renderList([INVITED], { resend, disable });
    await userEvent.click(screen.getByRole("button", { name: "Reenviar invitación" }));

    await waitFor(() => expect(calls.resend).toHaveLength(1));
    expect(calls.resend[0].get("accountId")).toBe("invited-1");
  });

  it("asks before disabling and then sends the id of the account", async () => {
    const { calls, resend, disable } = recordingActions();

    renderList([ACTIVE], { resend, disable });
    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    expect(calls.disable).toHaveLength(0);
    expect(screen.getByText("¿Desactivar a Luis Gómez? Dejará de poder entrar.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sí, desactivar" }));

    await waitFor(() => expect(calls.disable).toHaveLength(1));
    expect(calls.disable[0].get("accountId")).toBe("active-1");
  });

  it("lets the person back out of disabling", async () => {
    const { calls, resend, disable } = recordingActions();

    renderList([ACTIVE], { resend, disable });
    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(calls.disable).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
  });

  it("shows the reason when the server refuses", async () => {
    const refuse: ManagementAction = async () => ({ status: "error", message: "No puedes gestionar esta cuenta." });

    renderList([INVITED], { resend: refuse, disable: refuse });
    await userEvent.click(screen.getByRole("button", { name: "Reenviar invitación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No puedes gestionar esta cuenta.");
  });
});

interface Actions {
  resend: ManagementAction;
  disable: ManagementAction;
}

function renderList(accounts: ManagedAccount[], actions: Actions = recordingActions()) {
  render(<ManagedAccountList accounts={accounts} resendAction={actions.resend} disableAction={actions.disable} />);
}

function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest("li");

  if (!row) throw new Error(`There is no row for ${name}`);

  return row;
}

function recordingActions() {
  const calls: Record<"resend" | "disable", FormData[]> = { resend: [], disable: [] };

  const record =
    (key: "resend" | "disable"): ManagementAction =>
    async (_previous, form) => {
      calls[key].push(form);

      return { status: "done", message: "Listo." };
    };

  return { calls, resend: record("resend"), disable: record("disable") };
}
