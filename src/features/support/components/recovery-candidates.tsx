import type { CandidateView } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import { PendingButton } from "@shared/components/pending-button";

interface RecoveryCandidatesProps {
  candidates: readonly CandidateView[];
  recoverAction: (form: FormData) => void;
  isRecovering: boolean;
}

const COPY = SUPPORT_COPY.recovery.candidates;

/**
 * The passports that match the search, with what the agent compares with the visitor before handing over an access: the
 * gamertag and the number of stands visited. The email is masked and the PIN is never here.
 */
export function RecoveryCandidates({ candidates, recoverAction, isRecovering }: Readonly<RecoveryCandidatesProps>) {
  return (
    <section aria-labelledby="recovery-candidates-heading" className="grid gap-4">
      <h2 id="recovery-candidates-heading" className="type-section">
        {COPY.heading}
      </h2>
      <p className="m-0 text-sm text-muted">{COPY.hint}</p>
      <p className="m-0 type-tiny">{COPY.count(candidates.length)}</p>
      <ul className="m-0 grid list-none gap-3 p-0">
        {candidates.map((candidate) => (
          <li key={candidate.visitorId} className="border border-border p-4" data-testid="recovery-candidate">
            <CandidateCard candidate={candidate} recoverAction={recoverAction} isRecovering={isRecovering} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface CandidateCardProps {
  candidate: CandidateView;
  recoverAction: (form: FormData) => void;
  isRecovering: boolean;
}

function CandidateCard({ candidate, recoverAction, isRecovering }: Readonly<CandidateCardProps>) {
  return (
    <form action={recoverAction} className="grid gap-3">
      <input type="hidden" name="visitorId" value={candidate.visitorId} />
      <div className="grid gap-1">
        <p className="m-0 text-lg">{candidate.fullName}</p>
        <p className="m-0 text-sm">{COPY.gamertag(candidate.gamertag)}</p>
        <p className="m-0 text-sm">{COPY.stands(candidate.standsVisited)}</p>
        <p className="m-0 text-sm text-muted">{COPY.email(candidate.maskedEmail)}</p>
        <p className="m-0 text-sm text-muted">
          {COPY.registered(formatEventDate(candidate.registeredAt, "numeric"), formatTimeOfDay(candidate.registeredAt))}
        </p>
      </div>
      <PendingButton type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isRecovering}>
        {isRecovering ? COPY.recovering : COPY.recover}
      </PendingButton>
    </form>
  );
}
