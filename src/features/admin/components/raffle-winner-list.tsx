import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { formatAdminDateTime } from "@features/admin/lib/admin-records";
import { markRaffleWinnerNotifiedAction } from "@features/visitors/lib/visitors-actions";
import type { RaffleWinner } from "@features/visitors/lib/types";

interface RaffleWinnerListProps {
  winners: readonly RaffleWinner[];
}

/** Ganadores del sorteo con su teléfono para avisarles y el estado del aviso. */
export function RaffleWinnerList({ winners }: Readonly<RaffleWinnerListProps>) {
  const copy = ADMIN_COPY.raffle;

  if (winners.length === 0) {
    return <p className="m-0 text-sm text-muted">{copy.noWinners}</p>;
  }

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {winners.map((winner) => (
        <li
          key={winner.ticketNumber}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="type-tiny text-muted">
              {copy.ticket} #{winner.ticketNumber} · {copy.wonAt} {formatAdminDateTime(winner.wonAt)}
            </span>
            <span className="font-mono text-base break-all">{winner.gamertag}</span>
            <a href={`tel:${winner.phone}`} className="font-mono text-base text-accent">
              {winner.phone}
            </a>
          </div>
          {winner.notifiedAt ? (
            <span className="type-tiny text-success">
              {copy.notified} · {formatAdminDateTime(winner.notifiedAt)}
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <span className="type-tiny text-warning">{copy.pending}</span>
              <AdminActionButton
                action={markRaffleWinnerNotifiedAction.bind(null, winner.ticketNumber)}
                label={copy.markNotified}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
