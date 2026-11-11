import { act, renderHook } from "@testing-library/react";
import type { TournamentSnapshot } from "@features/tournament/api/tournament-api-client";
import { POLL_INTERVAL_MS, useTournament } from "@features/tournament/hooks/use-tournament";
import type { Tournament } from "@features/tournament/lib/types";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useTournament", () => {
  it("starts with the tournament the server rendered and polls every 3 seconds", async () => {
    const initial = createTestTournament();
    const load = jest.fn().mockResolvedValue(snapshotOf(withVersion(initial, 1)));
    const { result } = renderHook(() => useTournament(initial, load));

    expect(POLL_INTERVAL_MS).toBe(3000);
    expect(result.current.tournament).toBe(initial);
    expect(load).not.toHaveBeenCalled();

    await tick();

    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.tournament?.version).toBe(1);
  });

  it("keeps the last state and says the connection was lost when a poll fails, then recovers", async () => {
    const initial = createTestTournament();

    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(snapshotOf(withVersion(initial, 2)));

    const { result } = renderHook(() => useTournament(initial, load));

    await tick();

    expect(result.current.hasConnectionError).toBe(true);
    expect(result.current.tournament).toBe(initial);

    await tick();

    expect(result.current.hasConnectionError).toBe(false);
    expect(result.current.tournament?.version).toBe(2);
  });

  it("ignores an answer that is older than what it already shows", async () => {
    const initial = withVersion(createTestTournament(), 5);
    const load = jest.fn().mockResolvedValue(snapshotOf(withVersion(initial, 3)));
    const { result } = renderHook(() => useTournament(initial, load));

    await tick();

    expect(result.current.tournament?.version).toBe(5);
  });

  it("refreshes at once when asked, without waiting for the next poll", async () => {
    const initial = createTestTournament();
    const load = jest.fn().mockResolvedValue(snapshotOf(withVersion(initial, 1)));
    const { result } = renderHook(() => useTournament(initial, load));

    await act(async () => {
      await result.current.refresh();
    });

    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.tournament?.version).toBe(1);
  });

  it("does not start a second request while one is still in flight", async () => {
    const initial = createTestTournament();
    const load = jest.fn().mockReturnValue(new Promise(() => undefined));

    renderHook(() => useTournament(initial, load));
    await tick();
    await tick();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("stops polling when the screen is closed", async () => {
    const initial = createTestTournament();
    const load = jest.fn().mockResolvedValue(snapshotOf(initial));
    const { unmount } = renderHook(() => useTournament(initial, load));

    unmount();
    await tick();

    expect(load).not.toHaveBeenCalled();
  });

  it("takes the first bracket when it did not exist at render time", async () => {
    const created = createTestTournament();
    const load = jest.fn().mockResolvedValue(snapshotOf(created));
    const { result } = renderHook(() => useTournament(null, load));

    await tick();

    expect(result.current.tournament).toEqual(created);
  });
});

function snapshotOf(tournament: Tournament | null): TournamentSnapshot {
  return { tournament, serverNow: 0 };
}

function withVersion(tournament: Tournament, version: number): Tournament {
  return { ...tournament, version };
}

async function tick() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
  });
}
