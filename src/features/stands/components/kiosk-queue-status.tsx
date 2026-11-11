import type { VisitQueuePhase } from "@features/stands/hooks/use-visit-queue";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { RejectedQueuedVisit } from "@features/stands/lib/visit-queue";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface KioskQueueStatusProps {
  isOnline: boolean;
  pendingCount: number;
  phase: VisitQueuePhase;
  rejected: RejectedQueuedVisit[];
}

const COPY = STANDS_COPY.kiosk.queue;

/**
 * The bar of the offline queue (RF-35): how many visits are left to send and the ones the server refused, with the
 * reason. It never shows a rating nor a gamertag: a PIN that is nobody's identifies no one (RF-24, RF-29).
 */
export function KioskQueueStatus({ isOnline, pendingCount, phase, rejected }: Readonly<KioskQueueStatusProps>) {
  const line = describeQueue({ isOnline, pendingCount, phase });

  if (!line && rejected.length === 0) return null;

  return (
    <section aria-label={COPY.label} className="grid w-full max-w-xl gap-4">
      {line ? (
        <p role="status" className="m-0 border border-border p-4 type-mono">
          {line}
        </p>
      ) : null}
      {rejected.length > 0 ? <RejectedList rejected={rejected} /> : null}
    </section>
  );
}

function describeQueue({ isOnline, pendingCount, phase }: Omit<KioskQueueStatusProps, "rejected">): string | null {
  if (!isOnline) return COPY.offline(pendingCount);

  if (phase === "retrying" && pendingCount > 0) return COPY.retrying(pendingCount);

  if (pendingCount > 0) return COPY.sending(pendingCount);

  return phase === "allSent" ? COPY.allSent : null;
}

function RejectedList({ rejected }: Readonly<{ rejected: RejectedQueuedVisit[] }>) {
  return (
    <div className="grid gap-3 border border-danger p-4">
      <h2 className="m-0 type-mono text-danger">{COPY.rejectedHeading}</h2>
      <ul className="m-0 grid list-none gap-3 p-0">
        {rejected.map((visit) => (
          <li key={visit.id} className="grid gap-1">
            <span className="type-tiny text-muted">{COPY.rejectedAt(formatTimeOfDay(visit.scannedAt))}</span>
            <span>{COPY.reasons[visit.reason]}</span>
            <span className="text-sm text-muted">{COPY.instructions[visit.reason]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
