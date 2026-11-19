import { EmailRowActions } from "@features/admin/components/email-row-actions";
import type { EmailActions } from "@features/admin/components/email-actions-types";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { EmailRow, EmailStatus } from "@features/admin/lib/types";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

interface EmailListProps {
  rows: readonly EmailRow[];
  actions: EmailActions;
}

const COPY = ADMIN_COPY.emails;

const STATUS_CLASS: Record<EmailStatus, string> = {
  sent: "text-success",
  pending: "text-warning",
  failed: "text-danger",
};

/** The emails of the page, each with its full address (the sysadmin may see it), its attempts and what it can do. */
export function EmailList({ rows, actions }: Readonly<EmailListProps>) {
  if (rows.length === 0) return <p className="text-sm text-muted">{COPY.empty}</p>;

  return (
    <ul className="m-0 grid list-none gap-2 p-0" data-testid="emails-list">
      {rows.map((email) => (
        <li key={email.id} className="grid gap-2 border border-border p-3">
          <EmailSummary email={email} />
          <EmailRowActions
            email={email}
            resendAction={actions.resend}
            rebuildAction={actions.rebuild}
            viewAction={actions.view}
          />
        </li>
      ))}
    </ul>
  );
}

function EmailSummary({ email }: Readonly<{ email: EmailRow }>) {
  const kindName = email.kind ? COPY.kindNames[email.kind] : COPY.noKind;

  return (
    <div className="grid gap-1 text-sm wrap-break-word">
      <p>
        <strong className={STATUS_CLASS[email.status]}>{COPY.statusNames[email.status]}</strong> {email.subject}
      </p>
      <p>{email.to}</p>
      <p className="type-tiny text-muted">
        {COPY.row.kind(kindName)} {COPY.row.queued(formatMoment(email.createdAt))} {COPY.row.attempts(email.attempts)}{" "}
        {email.sentAt
          ? COPY.row.sentAt(formatMoment(email.sentAt))
          : COPY.row.nextAttempt(formatMoment(email.nextAttemptAt))}
      </p>
      {email.lastError ? <p className="type-tiny text-muted">{COPY.row.lastError(email.lastError)}</p> : null}
      <RebuildNote email={email} />
    </div>
  );
}

// An abandoned email without body that cannot be made again says why, so the missing button is not a mystery.
function RebuildNote({ email }: Readonly<{ email: EmailRow }>) {
  if (email.hasBody || email.status === "sent" || email.canRebuild) return null;

  const reason =
    email.kind === "login_code" || email.kind === "emergency"
      ? COPY.cannotRebuild[email.kind]
      : COPY.cannotRebuild.noKind;

  return <p className="type-tiny text-muted">{reason}</p>;
}

function formatMoment(instant: string): string {
  return `${formatEventDate(instant, "numeric")} ${formatTimeOfDay(instant)}`;
}
