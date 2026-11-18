import { cn } from "@heroui/react";

interface NoWinnersIconProps {
  className?: string;
}

/**
 * An empty podium with a dashed place on top: no winner has been confirmed yet (S28). It is decorative (the message
 * next to it says it) and takes its color from the text, like the raffle ticket emblem.
 */
export function NoWinnersIcon({ className }: Readonly<NoWinnersIconProps>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      data-testid="no-winners-icon"
      className={cn("h-16 w-24", className)}
    >
      <path d="M8 60V38h28V26h24v18h28v16z" />
      <path d="M36 38v22M60 44v16" />
      <circle cx="48" cy="12" r="7" strokeDasharray="3 4" />
    </svg>
  );
}
