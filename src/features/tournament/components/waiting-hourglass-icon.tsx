import { cn } from "@heroui/react";

interface WaitingHourglassIconProps {
  className?: string;
}

/**
 * An hourglass with its sand falling: the bracket is not shown here yet (S13). It is decorative (the message next to it
 * says it), takes its color from the text, and the falling sand only pulses when the visitor allows motion.
 */
export function WaitingHourglassIcon({ className }: Readonly<WaitingHourglassIconProps>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      data-testid="waiting-hourglass-icon"
      className={cn("h-16 w-12", className)}
    >
      <path d="M6 4h36M6 60h36" />
      <path d="M12 4v8l10 20-10 20v8M36 4v8L26 32l10 20v8" />
      <path d="M17 14h14l-7 12z" fill="currentColor" stroke="none" />
      <path d="M15 58h18l-9-8z" fill="currentColor" stroke="none" />
      <path d="M24 34v14" strokeDasharray="2 3" className="motion-safe:animate-pulse" />
    </svg>
  );
}
