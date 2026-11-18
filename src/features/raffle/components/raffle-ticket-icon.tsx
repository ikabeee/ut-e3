import { cn } from "@heroui/react";

interface RaffleTicketIconProps {
  className?: string;
}

/**
 * A raffle ticket with its notches, perforation and a star: the emblem of the raffle. It is decorative (the heading
 * next to it already says what the page is) and takes its color from the text, so `text-accent` paints it.
 */
export function RaffleTicketIcon({ className }: Readonly<RaffleTicketIconProps>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      data-testid="raffle-ticket-icon"
      className={cn("h-16 w-24", className)}
    >
      <path d="M4 8h88v14a10 10 0 0 0 0 20v14H4V42a10 10 0 0 0 0-20z" />
      <path d="M32 8v48" strokeDasharray="4 5" strokeLinejoin="miter" />
      <path d="m64 20 4.4 8.9 9.8 1.4-7.1 6.9 1.7 9.8-8.8-4.6-8.8 4.6 1.7-9.8-7.1-6.9 9.8-1.4z" fill="currentColor" />
    </svg>
  );
}
