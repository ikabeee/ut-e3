import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { RaffleWin } from "@features/raffle/lib/types";

interface RaffleWinNoticeProps {
  win: RaffleWin;
}

const COPY = RAFFLE_COPY.passport;

/** "Ganaste" on the passport of a confirmed winner, and the prize once it is registered (RF-25). */
export function RaffleWinNotice({ win }: Readonly<RaffleWinNoticeProps>) {
  return (
    <section
      aria-labelledby="raffle-win-heading"
      className="grid w-full max-w-sm gap-2 border border-accent bg-surface p-6 text-center"
    >
      <h2 id="raffle-win-heading" className="m-0 type-section text-accent">
        {COPY.heading}
      </h2>
      <p className="m-0">{COPY.line(win.ticketNumber)}</p>
      <p className="m-0 text-sm text-muted">{win.prizeName ? COPY.prize(win.prizeName) : COPY.prizePending}</p>
    </section>
  );
}
