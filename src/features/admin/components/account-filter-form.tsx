import Link from "next/link";
import { Button, buttonVariants, Input, Label, TextField } from "@heroui/react";
import { OptionSelect, type RoleOption } from "@features/accounts/components/invite-account-form";
import { ALL_FILTER_VALUE, type AccountAdminFilter } from "@features/accounts/lib/account-admin-filter";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { ACCOUNT_ROLES } from "@features/accounts/lib/types";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_ACCOUNTS_PATH } from "@features/admin/lib/admin-links";

interface AccountFilterFormProps {
  filter: AccountAdminFilter;
  stands: readonly RoleOption[];
}

const COPY = ADMIN_COPY.accounts.filter;

const STATUS_COPY = ACCOUNTS_COPY.management.panel.statuses;

/** A GET form: the filter lives in the URL, so a filtered list can be shared and survives a refresh. */
export function AccountFilterForm({ filter, stands }: Readonly<AccountFilterFormProps>) {
  return (
    <form method="get" aria-label={COPY.label} className="flex flex-wrap items-end gap-3">
      <TextField name="q" defaultValue={filter.search ?? ""} className="max-w-sm grow">
        <Label>{COPY.search}</Label>
        <Input className="min-h-11 text-base" autoComplete="off" />
      </TextField>
      <OptionSelect name="role" label={COPY.role} options={buildRoleOptions()} defaultValue={filter.role} />
      <OptionSelect name="status" label={COPY.status} options={buildStatusOptions()} defaultValue={filter.status} />
      <OptionSelect name="stand" label={COPY.stand} options={withAll(stands)} defaultValue={filter.standId} />
      <Button type="submit" variant="primary" className="min-h-11">
        {COPY.submit}
      </Button>
      <Link href={ADMIN_ACCOUNTS_PATH} className={buttonVariants({ variant: "tertiary", className: "min-h-11" })}>
        {COPY.clear}
      </Link>
    </form>
  );
}

function buildRoleOptions(): RoleOption[] {
  const roles = ACCOUNT_ROLES.map((role) => ({ value: role, label: ACCOUNTS_COPY.management.panel.roles[role] }));

  return withAll(roles);
}

function buildStatusOptions(): RoleOption[] {
  const statuses = Object.entries(STATUS_COPY).map(([value, label]) => ({ value, label }));

  return withAll(statuses);
}

function withAll(options: readonly RoleOption[]): RoleOption[] {
  return [{ value: ALL_FILTER_VALUE, label: COPY.all }, ...options];
}
