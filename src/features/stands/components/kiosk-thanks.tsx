"use client";

import { useEffect } from "react";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

interface KioskThanksProps {
  message: string;
  /** Called once the screen has been up long enough to be read; the kiosk goes back to the PIN screen. */
  onFinished: () => void;
}

const COPY = STANDS_COPY.kiosk.thanks;

const THANKS_DURATION_MS = 4000;

// The staff never sees the ratings (RF-29): after sending, the screen only thanks and returns to the PIN by itself.
export function KioskThanks({ message, onFinished }: Readonly<KioskThanksProps>) {
  useEffect(() => {
    const timer = window.setTimeout(onFinished, THANKS_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [onFinished]);

  return (
    <div role="status" className="grid w-full max-w-xl gap-3 border border-border p-8 text-center">
      <h2 className="type-section">{COPY.heading}</h2>
      <p className="m-0">{message}</p>
      <p className="m-0 type-tiny text-muted">{COPY.back}</p>
    </div>
  );
}
