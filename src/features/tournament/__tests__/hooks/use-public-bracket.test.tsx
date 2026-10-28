import { act, renderHook } from "@testing-library/react";
import type { PublicSnapshot } from "@features/tournament/lib/public-bracket";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import { usePublicBracket } from "@features/tournament/hooks/use-public-bracket";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("usePublicBracket", () => {
  it("polls every 3 seconds and shows the bracket once it is generated", async () => {
    const load = jest.fn().mockResolvedValue(openAt(0));
    const { result } = renderHook(() => usePublicBracket(PENDING, load));

    expect(result.current.snapshot.state).toBe("pending");

    await tick();

    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.snapshot.state).toBe("open");
  });

  it("hides the bracket as soon as the administrator closes it (RF-74)", async () => {
    const load = jest.fn().mockResolvedValue({ state: "closed", serverNow: 2 });
    const { result } = renderHook(() => usePublicBracket(openAt(4), load));

    await tick();

    expect(result.current.snapshot).toEqual({ state: "closed", serverNow: 2 });
  });

  it("shows the bracket again when it is reopened", async () => {
    const load = jest.fn().mockResolvedValue(openAt(1));
    const { result } = renderHook(() => usePublicBracket({ state: "closed", serverNow: 0 }, load));

    await tick();

    expect(result.current.snapshot.state).toBe("open");
  });

  it("ignores an open answer older than the one it shows", async () => {
    const load = jest.fn().mockResolvedValue(openAt(2));
    const initial = openAt(5);
    const { result } = renderHook(() => usePublicBracket(initial, load));

    await tick();

    expect(result.current.snapshot).toBe(initial);
  });

  it("takes a newer open answer", async () => {
    const load = jest.fn().mockResolvedValue(openAt(6));
    const { result } = renderHook(() => usePublicBracket(openAt(5), load));

    await tick();

    expect(result.current.snapshot.state === "open" && result.current.snapshot.bracket.version).toBe(6);
  });

  it("keeps what it shows and warns when the connection fails, then recovers", async () => {
    const initial = openAt(1);
    const load = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(openAt(2));
    const { result } = renderHook(() => usePublicBracket(initial, load));

    await tick();

    expect(result.current.hasConnectionError).toBe(true);
    expect(result.current.snapshot).toBe(initial);

    await tick();

    expect(result.current.hasConnectionError).toBe(false);
  });
});

const PENDING: PublicSnapshot = { state: "pending", serverNow: 0 };

function openAt(version: number): PublicSnapshot {
  return { state: "open", bracket: { ...toPublicBracket(createTestTournament()), version }, serverNow: version };
}

async function tick() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
  });
}
