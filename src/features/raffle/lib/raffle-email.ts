import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { formatTimeOfDay } from "@shared/lib/date-time";

export interface WinnerEmailInput {
  to: string;
  gamertag: string;
  ticketNumber: number;
  decidedAt: Date;
}

/** The email to a confirmed winner (RF-53): gamertag, ticket number and the hour, in Cancun time. */
export function buildWinnerEmail({ to, gamertag, ticketNumber, decidedAt }: WinnerEmailInput) {
  return {
    to,
    subject: RAFFLE_COPY.email.subject,
    text: RAFFLE_COPY.email.body(gamertag, ticketNumber, formatTimeOfDay(decidedAt.toISOString())),
  };
}
