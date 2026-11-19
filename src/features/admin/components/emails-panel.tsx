import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { EmailBulkActions } from "@features/admin/components/email-bulk-actions";
import { EmailFiltersForm } from "@features/admin/components/email-filters-form";
import { EmailList } from "@features/admin/components/email-list";
import type { EmailActions } from "@features/admin/components/email-actions-types";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_EMAILS_PATH } from "@features/admin/lib/admin-links";
import { buildEmailsHref, type EmailFilters } from "@features/admin/lib/email-filters";
import type { EmailPage, ServerStatus } from "@features/admin/lib/types";

interface EmailsPanelProps {
  summary: ServerStatus["outbox"];
  resendableFailed: number;
  emails: EmailPage;
  filters: EmailFilters;
  actions: EmailActions;
}

const COPY = ADMIN_COPY.emails;

/** The whole outbox for the sysadmin (S6): counts, the actions on all of it, the filters and one page of emails. */
export function EmailsPanel({ summary, resendableFailed, emails, filters, actions }: Readonly<EmailsPanelProps>) {
  return (
    <section aria-labelledby="emails-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="emails-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p>{COPY.summary(summary.sent, summary.pending, summary.failed)}</p>
      </div>
      <EmailBulkActions
        resendableFailed={resendableFailed}
        resendFailedAction={actions.resendFailed}
        sendNowAction={actions.sendNow}
      />
      <EmailFiltersForm filters={filters} />
      <p className="text-sm text-muted">{COPY.total(emails.total)}</p>
      <EmailList rows={emails.rows} actions={actions} />
      <EmailPagination page={emails.page} pageCount={emails.pageCount} filters={filters} />
    </section>
  );
}

function EmailPagination({
  page,
  pageCount,
  filters,
}: Readonly<{ page: number; pageCount: number; filters: EmailFilters }>) {
  if (pageCount === 1) return null;

  return (
    <nav aria-label={COPY.pagination.label} className="flex flex-wrap items-center gap-3">
      {page > 1 ? (
        <PageLink label={COPY.pagination.previous} href={buildEmailsHref(ADMIN_EMAILS_PATH, filters, page - 1)} />
      ) : null}
      <span className="text-sm">{COPY.pagination.position(page, pageCount)}</span>
      {page < pageCount ? (
        <PageLink label={COPY.pagination.next} href={buildEmailsHref(ADMIN_EMAILS_PATH, filters, page + 1)} />
      ) : null}
    </nav>
  );
}

function PageLink({ label, href }: Readonly<{ label: string; href: string }>) {
  return (
    <Link href={href} className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
      {label}
    </Link>
  );
}
