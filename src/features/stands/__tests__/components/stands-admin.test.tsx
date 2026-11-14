import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { StandsAdmin, type StandsAdminActions } from "@features/stands/components/stands-admin";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { AdminStand } from "@features/stands/lib/types";

const COPY = STANDS_COPY.admin;

const ADMIN = {
  id: "account-1",
  name: "Ana Pérez",
  email: "ana@ut.mx",
  role: "stand_admin",
  status: "active",
  kofDesk: null,
  standId: "stand-1",
} as const;

const STAND: AdminStand = {
  id: "stand-1",
  zone: "A",
  number: 1,
  studio: 6,
  groupCode: "101",
  code: "ZA-S1-E6-101",
  gameName: "Ruta 9",
  admins: [ADMIN],
  activeStaff: 2,
};

describe("StandsAdmin (RF-38, RF-39)", () => {
  it("lists the stands with the full code, the game, the staff in use and the administrator", () => {
    render(<StandsAdmin stands={[STAND]} actions={recordingActions().actions} />);

    expect(screen.getByRole("heading", { name: COPY.heading })).toBeInTheDocument();
    expect(screen.getByText("ZA-S1-E6-101")).toBeInTheDocument();
    expect(screen.getByText(COPY.gameOf("Ruta 9"))).toBeInTheDocument();
    expect(screen.getByText(COPY.staffCount(2))).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
  });

  it("says when the stand has no game and when there are no stands", () => {
    const { rerender } = render(
      <StandsAdmin stands={[{ ...STAND, gameName: null }]} actions={recordingActions().actions} />,
    );

    expect(screen.getByText(COPY.gameOf(null))).toBeInTheDocument();

    rerender(<StandsAdmin stands={[]} actions={recordingActions().actions} />);

    expect(screen.getByText(COPY.empty)).toBeInTheDocument();
  });

  it("creates a stand and its administrator from one form", async () => {
    const { actions, received } = recordingActions();

    render(<StandsAdmin stands={[]} actions={actions} />);
    await userEvent.type(screen.getByLabelText(COPY.fields.number), "2");
    await userEvent.type(screen.getByLabelText(COPY.fields.studio), "6");
    await userEvent.type(screen.getByLabelText(COPY.fields.group), "101");
    await userEvent.type(screen.getByLabelText(COPY.fields.adminName), "Ana Pérez");
    await userEvent.type(screen.getByLabelText(COPY.fields.adminEmail), "ana@ut.mx");
    await userEvent.click(screen.getByRole("button", { name: COPY.createSubmit }));

    await waitFor(() => expect(received.create).toHaveLength(1));
    expect(Object.fromEntries(received.create[0])).toMatchObject({
      zone: "A",
      number: "2",
      studio: "6",
      groupCode: "101",
      adminName: "Ana Pérez",
      adminEmail: "ana@ut.mx",
    });
    expect(await screen.findByText("done")).toBeInTheDocument();
  });

  it("has no field for the code of the stand", () => {
    const { container } = render(<StandsAdmin stands={[]} actions={recordingActions().actions} />);

    expect(container.querySelector("[name=code]")).toBeNull();
  });

  it("edits a stand with its values and posts its id", async () => {
    const { actions, received } = recordingActions();

    render(<StandsAdmin stands={[STAND]} actions={actions} />);

    const row = within(findRow("ZA-S1-E6-101"));

    expect(row.getByLabelText(COPY.fields.studio)).toHaveValue("6");
    expect(row.getByLabelText(COPY.fields.group)).toHaveValue("101");

    await userEvent.click(row.getByRole("button", { name: COPY.editSubmit }));

    await waitFor(() => expect(received.update).toHaveLength(1));
    expect(received.update[0].get("standId")).toBe("stand-1");
  });

  it("offers to invite an administrator only while the stand has no active one", async () => {
    const { actions, received } = recordingActions();
    const disabled = { ...ADMIN, status: "disabled" } as const;

    const { rerender } = render(<StandsAdmin stands={[STAND]} actions={actions} />);

    expect(screen.queryByText(COPY.noAdmin)).toBeNull();

    rerender(<StandsAdmin stands={[{ ...STAND, admins: [disabled] }]} actions={actions} />);

    expect(screen.getByText(COPY.noAdmin)).toBeInTheDocument();

    const row = within(findRow("ZA-S1-E6-101"));

    await userEvent.type(row.getByLabelText(COPY.fields.adminName), "Luis");
    await userEvent.type(row.getByLabelText(COPY.fields.adminEmail), "luis@ut.mx");
    await userEvent.click(row.getByRole("button", { name: COPY.inviteSubmit }));

    await waitFor(() => expect(received.inviteAdmin).toHaveLength(1));
    expect(received.inviteAdmin[0].get("standId")).toBe("stand-1");
  });

  it("lets the sysadmin disable the administrator through the accounts actions", async () => {
    const { actions, received } = recordingActions();

    render(<StandsAdmin stands={[STAND]} actions={actions} />);
    await userEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    await userEvent.click(screen.getByRole("button", { name: "Sí, desactivar" }));

    await waitFor(() => expect(received.disable).toHaveLength(1));
    expect(received.disable[0].get("accountId")).toBe("account-1");
  });
});

function findRow(code: string): HTMLElement {
  const row = screen.getByText(code).closest("li");

  if (!row) throw new Error(`The stand ${code} has no row`);

  return row;
}

type ActionName = keyof StandsAdminActions;

function recordingActions() {
  const received: Record<ActionName, FormData[]> = {
    create: [],
    update: [],
    inviteAdmin: [],
    resend: [],
    disable: [],
    reactivate: [],
  };

  const record =
    (name: ActionName): ManagementAction =>
    async (_previous, form): Promise<ManagementActionState> => {
      received[name].push(form);

      return { status: "done", message: "done" };
    };

  const actions: StandsAdminActions = {
    create: record("create"),
    update: record("update"),
    inviteAdmin: record("inviteAdmin"),
    resend: record("resend"),
    disable: record("disable"),
    reactivate: record("reactivate"),
  };

  return { actions, received };
}
