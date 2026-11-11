/**
 * @jest-environment node
 */
import { scheduleForcedExit, SHUTDOWN_DEADLINE_MS } from "@shared/lib/server/shutdown-deadline";

describe("scheduleForcedExit", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("exits with the SIGTERM code when the connections do not finish before the deadline", () => {
    const exit = jest.fn();

    scheduleForcedExit(exit, SHUTDOWN_DEADLINE_MS);
    jest.advanceTimersByTime(SHUTDOWN_DEADLINE_MS - 1);

    expect(exit).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(exit).toHaveBeenCalledWith(143);
  });

  it("leaves room before the 30 s that Docker waits for SIGKILL", () => {
    expect(SHUTDOWN_DEADLINE_MS).toBeLessThan(30_000);
  });
});
