import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminAccountList, type AdminAccountActions } from "@features/admin/components/admin-account-list";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import type { AdminAccountRow } from "@features/accounts/lib/types";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const BASE: AdminAccountRow = {
  id: "a",
  name: "Ana Pérez",
  email: "ana@ut.mx",
  role: "stand_staff",
  status: "active",
  kofDesk: null,
  secondaryRole: null,
  standId: "stand-1",
  createdAt: new Date("2026-11-10T18:30:00.000Z"),
  lastLoginAt: new Date("2026-11-19T15:00:00.000Z"),
};

const INVITED: AdminAccountRow = { ...BASE, id: "i", name: "Beto Invitado", status: "invited", lastLoginAt: null };

const DISABLED: AdminAccountRow = { ...BASE, id: "d", name: "Carla Baja", status: "disabled" };

const LEADER: AdminAccountRow = {
  ...BASE,
  id: "l",
  name: "Lía Líder",
  role: "stand_admin",
  secondaryRole: "help_desk",
};

const SOLO_LEADER: AdminAccountRow = { ...BASE, id: "s", name: "Saúl Solo", role: "stand_admin" };

const SELF: AdminAccountRow = { ...BASE, id: "me", name: "Yo Sysadmin", role: "sysadmin", standId: null };

describe("AdminAccountList", () => {
  describe("the secondary role (S1)", () => {
    it("names the secondary role of a stand administrator in its summary", () => {
      renderList([LEADER, SOLO_LEADER]);

      expect(rowOf("Lía Líder")).toHaveTextContent("Administrador de stand · Rol secundario: Atención · Stand ZA-S1");
      expect(rowOf("Saúl Solo")).not.toHaveTextContent("Rol secundario:");
    });

    it("offers the control to give or remove it only for stand administrators", () => {
      renderList([LEADER, BASE, SELF]);

      expect(within(rowOf("Lía Líder")).getByRole("button", { name: "Guardar rol secundario" })).toBeInTheDocument();
      expect(within(rowOf("Ana Pérez")).queryByRole("button", { name: "Guardar rol secundario" })).toBeNull();
      expect(within(rowOf("Yo Sysadmin")).queryByRole("button", { name: "Guardar rol secundario" })).toBeNull();
    });

    it("sends the account and its current secondary role, or 'none', to the action", async () => {
      const setSecondaryRole = jest.fn<ReturnType<ManagementAction>, Parameters<ManagementAction>>(async () => ({
        status: "done",
        message: "Rol secundario quitado.",
      }));

      renderList([LEADER, SOLO_LEADER], { setSecondaryRole });
      await userEvent.click(within(rowOf("Lía Líder")).getByRole("button", { name: "Guardar rol secundario" }));
      await userEvent.click(within(rowOf("Saúl Solo")).getByRole("button", { name: "Guardar rol secundario" }));

      await waitFor(() => expect(setSecondaryRole).toHaveBeenCalledTimes(2));
      expect(Object.fromEntries(setSecondaryRole.mock.calls[0][1])).toEqual({
        accountId: "l",
        secondaryRole: "help_desk",
      });
      expect(Object.fromEntries(setSecondaryRole.mock.calls[1][1])).toEqual({ accountId: "s", secondaryRole: "none" });
    });
  });

  it("says so when no account matches", () => {
    renderList([]);

    expect(screen.getByText("Ninguna cuenta coincide con el filtro.")).toBeInTheDocument();
  });

  it("shows the role, stand, status, creation date and last sign-in of each account", () => {
    renderList([BASE, INVITED]);

    expect(rowOf("Ana Pérez")).toHaveTextContent("Staff de stand · Stand ZA-S1 · Activa");
    expect(rowOf("Ana Pérez")).toHaveTextContent("Alta: 10.11.2026 13:30");
    expect(rowOf("Ana Pérez")).toHaveTextContent("Último acceso: 19.11.2026 10:00");
    expect(rowOf("Beto Invitado")).toHaveTextContent("Último acceso: nunca");
  });

  it("offers each status only the actions that make sense", () => {
    renderList([BASE, INVITED, DISABLED]);

    const labels = (name: string) =>
      within(rowOf(name))
        .getAllByRole("button")
        .map((button) => button.textContent);

    expect(labels("Ana Pérez")).toEqual([
      "Enviar restablecimiento de contraseña",
      "Cerrar sesiones",
      "Limpiar 2FA pendiente",
      "Desactivar",
    ]);
    expect(labels("Beto Invitado")).toEqual([
      "Reenviar invitación",
      "Cerrar sesiones",
      "Limpiar 2FA pendiente",
      "Desactivar",
    ]);
    expect(labels("Carla Baja")).toEqual(["Reactivar", "Cerrar sesiones", "Limpiar 2FA pendiente"]);
  });

  it("does not offer the sysadmin to disable itself", () => {
    renderList([SELF]);

    expect(within(rowOf("Yo Sysadmin")).queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
  });

  it("sends the id of the account to the action that was pressed and shows what the server answered", async () => {
    const closeSessions = jest.fn<ReturnType<ManagementAction>, Parameters<ManagementAction>>(async () => ({
      status: "done",
      message: "Se cerraron 2 sesiones.",
    }));

    renderList([BASE], { closeSessions });
    await userEvent.click(within(rowOf("Ana Pérez")).getByRole("button", { name: "Cerrar sesiones" }));

    await waitFor(() =>
      expect(within(rowOf("Ana Pérez")).getByRole("status")).toHaveTextContent("Se cerraron 2 sesiones."),
    );
    expect(closeSessions.mock.calls[0][1].get("accountId")).toBe("a");
  });
});

function renderList(accounts: AdminAccountRow[], overrides: Partial<AdminAccountActions> = {}) {
  const idle: ManagementAction = async () => ({ status: "done", message: "Listo." });

  const actions: AdminAccountActions = {
    resend: idle,
    disable: idle,
    reactivate: idle,
    resetPassword: idle,
    closeSessions: idle,
    clearTwoFactor: idle,
    setSecondaryRole: idle,
    ...overrides,
  };

  renderWithToasts(
    <AdminAccountList
      accounts={accounts}
      standCodes={{ "stand-1": "ZA-S1" }}
      currentAccountId="me"
      actions={actions}
    />,
  );
}

function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest("li");

  if (!row) throw new Error(`No row for ${name}`);

  return row;
}
