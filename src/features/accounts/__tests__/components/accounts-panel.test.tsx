import { render, screen } from "@testing-library/react";
import { AccountsPanel } from "@features/accounts/components/accounts-panel";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import type { ManagedAccount } from "@features/accounts/lib/types";

const action: ManagementAction = async () => ({ status: "done", message: "ok" });

const ACTIONS = { invite: action, resend: action, disable: action };

const ACCOUNT: ManagedAccount = {
  id: "a-1",
  name: "Ana Pérez",
  email: "ana@ut.mx",
  role: "kof_admin",
  status: "invited",
  kofDesk: null,
};

describe("AccountsPanel", () => {
  it("lets the sysadmin pick one of the administrators and shows no desk", () => {
    render(<AccountsPanel heading="Cuentas del evento" actorRole="sysadmin" accounts={[ACCOUNT]} actions={ACTIONS} />);

    expect(screen.getByRole("heading", { name: "Cuentas del evento" })).toBeInTheDocument();
    expect(screen.getByText("Rol")).toBeInTheDocument();
    expect(screen.queryByText("Mesa")).not.toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
  });

  it("asks the KOF administrator for the desk and does not ask for the role", () => {
    render(<AccountsPanel heading="Staff de las mesas" actorRole="kof_admin" accounts={[]} actions={ACTIONS} />);

    expect(screen.getByText("Mesa")).toBeInTheDocument();
    expect(screen.queryByText("Rol")).not.toBeInTheDocument();
    expect(screen.getByText("Todavía no hay cuentas.")).toBeInTheDocument();
  });
});
