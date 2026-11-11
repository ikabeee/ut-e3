"use client";

import { useCallback, useEffect, useRef } from "react";
import { isPinFilter, mayBeRegisteredPin, type PinFilter } from "@features/stands/lib/pin-filter";

const STORAGE_KEY = "ute3.kiosk.pin-filter.v1";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface PinFilterOptions {
  load: () => Promise<PinFilter>;
  isOnline: boolean;
}

/** Whether a PIN typed without connection may be registered; `true` when the kiosk cannot tell (no filter yet). */
export type PinFilterCheck = (pin: string) => Promise<boolean>;

/**
 * Keeps the filter of the registered PINs on the kiosk (RF-78): downloads it while there is a network (when the kiosk
 * opens, when the network comes back and every 5 minutes) and keeps the last one in localStorage for the offline hours.
 */
export function usePinFilter({ load, isOnline }: Readonly<PinFilterOptions>): PinFilterCheck {
  const filter = useRef<PinFilter | null>(null);

  const refresh = useCallback(async () => {
    try {
      filter.current = await load();
      saveFilter(filter.current);
    } catch {
      // Without an answer the kiosk keeps the filter it had.
    }
  }, [load]);

  useEffect(() => {
    filter.current ??= readSavedFilter();

    if (!isOnline) return;

    void refresh();

    const timer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isOnline, refresh]);

  return useCallback(async (pin: string) => checkPin(pin, filter.current), []);
}

// Web Crypto only exists on HTTPS and localhost: without it, or without a filter, the server decides (RF-24).
async function checkPin(pin: string, filter: PinFilter | null): Promise<boolean> {
  if (!filter || !globalThis.crypto?.subtle) return true;

  return mayBeRegisteredPin(pin, filter);
}

function readSavedFilter(): PinFilter | null {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");

    return isPinFilter(saved) ? saved : null;
  } catch {
    return null;
  }
}

function saveFilter(filter: PinFilter): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  } catch {
    // A full or blocked storage only loses the offline copy; the filter in memory still works.
  }
}
