import { act, renderHook } from "@testing-library/react";
import { useCountdown } from "@features/landing/hooks/use-countdown";

const TARGET = "2026-11-20T10:00:00-05:00";
const TARGET_MS = new Date(TARGET).getTime();

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(TARGET_MS - (2 * 60 * 1000 + 3000));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the remaining time and ticks every second", () => {
    const { result } = renderHook(() => useCountdown(TARGET));

    expect(result.current).toEqual({ days: 0, hours: 0, minutes: 2, seconds: 3 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toEqual({ days: 0, hours: 0, minutes: 2, seconds: 2 });
  });

  it("stays at zero after the start", () => {
    const { result } = renderHook(() => useCountdown(TARGET));

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(result.current).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("stops ticking on unmount", () => {
    const { unmount } = renderHook(() => useCountdown(TARGET));

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
