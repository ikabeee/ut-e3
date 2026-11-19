import Link from "next/link";
import { Button, buttonVariants, Form, Input, Label, TextField } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildEmailsHref, type EmailFilters, type EmailStatusFilter } from "@features/admin/lib/email-filters";
import { ADMIN_EMAILS_PATH } from "@features/admin/lib/admin-links";

const COPY = ADMIN_COPY.emails.filters;

const STATUSES: readonly EmailStatusFilter[] = ["all", "sent", "pending", "failed"];

/** The status as links (a tap each, no menu) and the text and date filters as a form that reads from the URL. */
export function EmailFiltersForm({ filters }: Readonly<{ filters: EmailFilters }>) {
  return (
    <div className="grid gap-4">
      <nav aria-label={COPY.statusNav} className="flex flex-wrap gap-3">
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={buildEmailsHref(ADMIN_EMAILS_PATH, { ...filters, status }, 1)}
            aria-current={status === filters.status ? "page" : undefined}
            className={buttonVariants({
              variant: status === filters.status ? "primary" : "outline",
              className: "min-h-11",
            })}
          >
            {COPY[status]}
          </Link>
        ))}
      </nav>
      <Form method="get" action={ADMIN_EMAILS_PATH} aria-label={COPY.label} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="status" value={filters.status} />
        <FilterField name="recipient" label={COPY.recipient} value={filters.recipient} />
        <FilterField name="subject" label={COPY.subject} value={filters.subject} />
        <FilterField name="from" label={COPY.from} value={filters.from} type="date" />
        <FilterField name="to" label={COPY.to} value={filters.to} type="date" />
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit" variant="primary" className="min-h-11">
            {COPY.apply}
          </Button>
          <Link href={ADMIN_EMAILS_PATH} className={buttonVariants({ variant: "tertiary", className: "min-h-11" })}>
            {COPY.clear}
          </Link>
        </div>
      </Form>
    </div>
  );
}

interface FilterFieldProps {
  name: string;
  label: string;
  value: string;
  type?: "text" | "date";
}

function FilterField({ name, label, value, type = "text" }: Readonly<FilterFieldProps>) {
  return (
    <TextField name={name} defaultValue={value} type={type}>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" autoComplete="off" />
    </TextField>
  );
}
