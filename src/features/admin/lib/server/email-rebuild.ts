import "server-only";
import { rebuildInvitationEmail } from "@features/accounts/lib/server/invitations";
import { rebuildPasswordResetEmail } from "@features/accounts/lib/server/password-reset";
import type { RebuildableKind } from "@features/admin/lib/email-rebuild-rules";
import { rebuildWinnerEmail } from "@features/raffle/lib/server/raffle-mutations";
import { rebuildEntryEmail } from "@features/tournament/lib/server/entries-mutations";
import { rebuildRecoveryEmail } from "@features/visitors/lib/server/email-recovery";
import { rebuildPassportEmail } from "@features/visitors/lib/server/visitor-registration";
import type { Prisma } from "@generated/prisma/client";

/** Queues the email again from the record it was about; answers its id, or null when that record is gone or changed. */
type Rebuilder = (transaction: Prisma.TransactionClient, referenceId: string, now: Date) => Promise<string | null>;

// Each feature rebuilds its own email with the code that built the first one: a link kind issues a new link.
export const REBUILDERS: Record<RebuildableKind, Rebuilder> = {
  visitor_passport: (transaction, visitorId) => rebuildPassportEmail(transaction, visitorId),
  recovery_link: rebuildRecoveryEmail,
  kof_entry: (transaction, entryId) => rebuildEntryEmail(transaction, entryId),
  staff_invitation: rebuildInvitationEmail,
  password_reset: rebuildPasswordResetEmail,
  raffle_winner: (transaction, drawId) => rebuildWinnerEmail(transaction, drawId),
};
