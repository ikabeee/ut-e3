"use client";

import { useEffect, useState } from "react";
import type { LiveDraw } from "@features/raffle/lib/types";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** How long the drum turns before it shows the ticket that came out. */
export const SPIN_DURATION_MS = 3000;

const ROLL_INTERVAL_MS = 70;

export interface SpinReveal {
  /** A new ticket came out and the drum is still turning: its number and gamertag stay hidden. */
  isSpinning: boolean;
  /** The number the drum shows while it turns; `null` with reduced motion, which shows no rolling digits. */
  rollingNumber: number | null;
}

interface SpinRevealOptions {
  /** The highest number the rolling digits may show. */
  maxNumber: number;
  durationMs?: number;
}

/**
 * Turns the drum each time a new draw arrives (RF-49). The draw the page opened with is shown at once: only a spin seen
 * live turns. The number that comes out was already decided by the server; the rolling digits are only a show.
 */
export function useSpinReveal(
  latest: LiveDraw | null,
  { maxNumber, durationMs = SPIN_DURATION_MS }: SpinRevealOptions,
): SpinReveal {
  const [revealedId, setRevealedId] = useState(latest?.id ?? null);
  const [rollingNumber, setRollingNumber] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const spinningId = latest && latest.id !== revealedId ? latest.id : null;

  useEffect(() => {
    if (!spinningId) return;

    const roll = prefersReducedMotion
      ? null
      : setInterval(() => setRollingNumber(randomTicket(maxNumber)), ROLL_INTERVAL_MS);

    const stop = setTimeout(() => setRevealedId(spinningId), durationMs);

    return () => {
      clearTimeout(stop);

      if (roll) clearInterval(roll);
    };
  }, [spinningId, prefersReducedMotion, maxNumber, durationMs]);

  return { isSpinning: spinningId !== null, rollingNumber: spinningId && !prefersReducedMotion ? rollingNumber : null };
}

function randomTicket(maxNumber: number): number {
  return 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % Math.max(1, maxNumber));
}
