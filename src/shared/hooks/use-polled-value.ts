"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PolledValueOptions<T> {
  /** Asks the server for the latest value. It must be a stable function, or the timer restarts on every render. */
  load: () => Promise<T>;
  /** Decides what to keep when an answer arrives; answers can come out of order. */
  merge: (current: T, incoming: T) => T;
  intervalMs: number;
}

export interface PolledValue<T> {
  value: T;
  /** The last request failed; the screen keeps showing the last value it received. */
  hasConnectionError: boolean;
  /** Asks at once, without waiting for the next tick. */
  refresh: () => Promise<void>;
}

/** Keeps a value fresh by asking the server every `intervalMs`, never with two requests in flight. */
export function usePolledValue<T>(initial: T, { load, merge, intervalMs }: PolledValueOptions<T>): PolledValue<T> {
  const [value, setValue] = useState(initial);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const isLoading = useRef(false);

  const refresh = useCallback(async () => {
    if (isLoading.current) return;

    isLoading.current = true;

    try {
      const incoming = await load();

      setValue((current) => merge(current, incoming));
      setHasConnectionError(false);
    } catch {
      setHasConnectionError(true);
    } finally {
      isLoading.current = false;
    }
  }, [load, merge]);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), intervalMs);

    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { value, hasConnectionError, refresh };
}
