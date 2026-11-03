import { useState, useSyncExternalStore } from "react";

interface Clock {
  read: () => number;
  subscribe: (onChange: () => void) => () => void;
}

/**
 * The current time in milliseconds, refreshed every `intervalMs`, for text such as "hace 5 min". It is 0 until the page
 * is in the browser: Next prerenders client components too, and a clock read while rendering is not allowed there.
 */
export function useNow(intervalMs: number): number {
  const [clock] = useState(() => createClock(intervalMs));

  return useSyncExternalStore(clock.subscribe, clock.read, readServerTime);
}

function createClock(intervalMs: number): Clock {
  let now = 0;

  return {
    read: () => now,
    subscribe: (onChange) => {
      now = Date.now();
      onChange();

      const timer = setInterval(() => {
        now = Date.now();
        onChange();
      }, intervalMs);

      return () => clearInterval(timer);
    },
  };
}

function readServerTime(): number {
  return 0;
}
