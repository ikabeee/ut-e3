import { act, render, screen } from "@testing-library/react";
import { RaffleLiveScreen } from "@features/raffle/components/raffle-live-screen";
import { RaffleWinNotice } from "@features/raffle/components/raffle-win-notice";
import { RAFFLE_POLL_INTERVAL_MS } from "@features/raffle/hooks/use-raffle-snapshot";
import { SPIN_DURATION_MS } from "@features/raffle/hooks/use-spin-reveal";
import type { LiveDraw, RaffleLiveSnapshot } from "@features/raffle/lib/types";
import { createLiveSnapshot, DRAW_ID } from "@features/raffle/__tests__/components/raffle-test-snapshots";

const LATEST: LiveDraw = {
  id: DRAW_ID,
  ticketNumber: 12,
  gamertag: "Neo",
  outcome: "pending",
  drawnAt: "2026-11-20T23:05:00.000Z",
};

afterEach(() => {
  jest.useRealTimers();
});

async function advance(milliseconds: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds);
  });
}

describe("RaffleLiveScreen", () => {
  it("announces the hour before the raffle starts", () => {
    render(<RaffleLiveScreen initial={createLiveSnapshot({ phase: "upcoming" })} load={jest.fn()} />);

    expect(screen.getByText("La rifa empieza a las 18:00")).toBeInTheDocument();
  });

  it("shows the ticket the page opened with at once, without spinning", () => {
    render(<RaffleLiveScreen initial={createLiveSnapshot({ latest: LATEST })} load={jest.fn()} />);

    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("Neo")).toBeInTheDocument();
    expect(screen.getByText("¿Está presente?")).toBeInTheDocument();
  });

  it("spins when a new ticket arrives by polling and only then shows it (RF-49)", async () => {
    jest.useFakeTimers();

    const next: RaffleLiveSnapshot = createLiveSnapshot({ latest: LATEST, revision: 1 });
    const load = jest.fn(async () => next);

    render(<RaffleLiveScreen initial={createLiveSnapshot()} load={load} />);

    expect(screen.getByText("Esperando el primer giro")).toBeInTheDocument();

    await advance(RAFFLE_POLL_INTERVAL_MS);

    expect(screen.getByText("Girando…")).toBeInTheDocument();
    expect(screen.queryByText("Neo")).not.toBeInTheDocument();

    await advance(SPIN_DURATION_MS);

    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("Neo")).toBeInTheDocument();
  });

  it("lists the confirmed winners with their prize, or says it is still to be handed over", () => {
    const winners = [
      { drawId: "a", ticketNumber: 3, gamertag: "Trinity", decidedAt: "2026-11-20T23:06:00.000Z", prizeName: "Taza" },
      { drawId: "b", ticketNumber: 9, gamertag: "Morpheus", decidedAt: "2026-11-20T23:10:00.000Z", prizeName: null },
    ];

    render(<RaffleLiveScreen initial={createLiveSnapshot({ phase: "closed", winners })} load={jest.fn()} />);

    expect(screen.getByText("La rifa terminó. ¡Gracias por participar!")).toBeInTheDocument();
    expect(screen.getByText("Taza")).toBeInTheDocument();
    expect(screen.getByText("Premio por entregar")).toBeInTheDocument();
    expect(screen.getByText("18:10")).toBeInTheDocument();
  });
});

describe("RaffleWinNotice", () => {
  it("says Ganaste with the ticket, and the prize once it is registered (RF-25)", () => {
    const { rerender } = render(
      <RaffleWinNotice win={{ ticketNumber: 12, decidedAt: LATEST.drawnAt, prizeName: null }} />,
    );

    expect(screen.getByRole("heading", { name: "Ganaste" })).toBeInTheDocument();
    expect(screen.getByText("Tu boleto #12 salió en la rifa.")).toBeInTheDocument();
    expect(screen.getByText(/Recoge tu premio/)).toBeInTheDocument();

    rerender(<RaffleWinNotice win={{ ticketNumber: 12, decidedAt: LATEST.drawnAt, prizeName: "Taza" }} />);

    expect(screen.getByText("Premio: Taza")).toBeInTheDocument();
  });
});
