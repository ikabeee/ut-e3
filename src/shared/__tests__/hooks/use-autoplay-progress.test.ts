import { act, renderHook } from "@testing-library/react";
import { useAutoplayProgress } from "@shared/hooks/use-autoplay-progress";

const DURATION = 1000;

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

describe("useAutoplayProgress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not schedule animation frames while paused", () => {
    const requestFrame = jest.spyOn(window, "requestAnimationFrame");

    renderHook(() => useAutoplayProgress({ duration: DURATION, isPaused: true, stepKey: 0, onComplete: jest.fn() }));
    advance(DURATION * 3);

    expect(requestFrame).not.toHaveBeenCalled();
  });

  it("resumes from the saved progress after a pause", () => {
    const onComplete = jest.fn();

    const { rerender } = renderHook(
      ({ isPaused }) => useAutoplayProgress({ duration: DURATION, isPaused, stepKey: 0, onComplete }),
      { initialProps: { isPaused: false } },
    );

    advance(DURATION * 0.6);
    rerender({ isPaused: true });
    advance(DURATION * 5);
    expect(onComplete).not.toHaveBeenCalled();

    rerender({ isPaused: false });
    advance(DURATION * 0.3);
    expect(onComplete).not.toHaveBeenCalled();

    advance(DURATION * 0.2);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
