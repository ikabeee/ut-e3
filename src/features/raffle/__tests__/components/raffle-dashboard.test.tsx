import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RaffleDashboard, type RaffleDashboardActions } from "@features/raffle/components/raffle-dashboard";
import type { RaffleAdminSnapshot } from "@features/raffle/lib/types";
import {
  createAdminSnapshot,
  createPendingDraw,
  DRAW_ID,
} from "@features/raffle/__tests__/components/raffle-test-snapshots";

describe("RaffleDashboard", () => {
  it("does not let anyone spin before the raffle starts", () => {
    renderDashboard(createAdminSnapshot({ phase: "upcoming" }));

    expect(screen.getByText("La rifa empieza a las 18:00.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Girar" })).toBeDisabled();
  });

  it("spins with a request id and opens the decision at once (RF-51)", async () => {
    const { actions } = renderDashboard(createAdminSnapshot());

    await userEvent.click(screen.getByRole("button", { name: "Girar" }));

    const form = jest.mocked(actions.spin).mock.calls[0][1];

    expect(String(form.get("requestId"))).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByRole("heading", { name: "Boleto #12" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ganador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartado" })).toBeInTheDocument();
  });

  it("keeps the spin blocked and shows the decision while its own ticket waits", () => {
    renderDashboard(createAdminSnapshot({ pending: createPendingDraw() }));

    // The dialog hides the rest of the page from assistive technology, so the button is looked up as hidden.
    expect(screen.getByRole("button", { name: "Girar", hidden: true })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Boleto #12" })).toBeInTheDocument();
  });

  it("tells another administrator that somebody else is spinning (RF-50)", async () => {
    renderDashboard(createAdminSnapshot({ pending: createPendingDraw({ drawnById: "admin-2" }) }));

    expect(screen.getByText("Otro animador está girando")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Boleto #12" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Decidir este boleto" }));

    expect(screen.getByRole("heading", { name: "Boleto #12" })).toBeInTheDocument();
  });

  it("sends the decision and closes the dialog without waiting for the next poll", async () => {
    const { actions } = renderDashboard(createAdminSnapshot({ pending: createPendingDraw() }));

    await userEvent.click(screen.getByRole("button", { name: "Descartado" }));

    const form = jest.mocked(actions.decide).mock.calls[0][1];

    expect(form.get("outcome")).toBe("discarded");
    expect(form.get("drawId")).toBe(DRAW_ID);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Boleto #12" })).not.toBeInTheDocument());
  });

  it("shows the message of a refused spin", async () => {
    const actions = createActions({
      spin: jest.fn(async () => ({ status: "error" as const, message: "No quedan boletos" })),
    });

    renderDashboard(createAdminSnapshot(), actions);
    await userEvent.click(screen.getByRole("button", { name: "Girar" }));

    expect(await screen.findByText("No quedan boletos")).toBeInTheDocument();
  });

  it("lets an administrator register the prize of a winner (RF-55)", async () => {
    const winner = { drawId: DRAW_ID, ticketNumber: 12, gamertag: "Neo", decidedAt: "2026-11-20T23:06:00.000Z" };

    const { actions } = renderDashboard(
      createAdminSnapshot({ winners: [{ ...winner, prizeName: null, prizeByName: null }] }),
    );

    await userEvent.type(screen.getByLabelText("Premio entregado"), "Audífonos");
    await userEvent.click(screen.getByRole("button", { name: "Registrar premio" }));

    const form = jest.mocked(actions.registerPrize).mock.calls[0][1];

    expect(form.get("prizeName")).toBe("Audífonos");
    expect(screen.getByText("Confirmado a las 18:06")).toBeInTheDocument();
  });

  it("asks before closing the raffle, and hides the closing once it is closed", async () => {
    const { actions } = renderDashboard(createAdminSnapshot());

    await userEvent.click(screen.getByRole("button", { name: "Cerrar la rifa" }));
    await userEvent.click(screen.getByRole("button", { name: "Sí, cerrar la rifa" }));

    expect(actions.close).toHaveBeenCalledTimes(1);
  });

  it("offers no closing once the raffle is closed", () => {
    renderDashboard(createAdminSnapshot({ phase: "closed", closedAt: "2026-11-20T23:30:00.000Z" }));

    expect(screen.getByText("La rifa se cerró a las 18:30.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar la rifa" })).not.toBeInTheDocument();
  });
});

function renderDashboard(initial: RaffleAdminSnapshot, actions = createActions(), load = jest.fn(async () => initial)) {
  render(<RaffleDashboard initial={initial} viewerId="admin-1" actions={actions} load={load} />);

  return { actions, load };
}

function createActions(overrides: Partial<RaffleDashboardActions> = {}): RaffleDashboardActions {
  return {
    spin: jest.fn(async () => ({ status: "drawn" as const, draw: createPendingDraw() })),
    decide: jest.fn(async () => ({ status: "done" as const })),
    close: jest.fn(async () => ({ status: "done" as const })),
    registerPrize: jest.fn(async () => ({ status: "done" as const })),
    ...overrides,
  };
}
