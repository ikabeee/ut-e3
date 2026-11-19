import { ACCOUNT_ROLES, type AccountRole, type AccountStatus } from "@features/accounts/lib/types";

/** What the list of /admin/accounts narrows by; every field is optional and an empty filter lists everything. */
export interface AccountAdminFilter {
  role?: AccountRole;
  status?: AccountStatus;
  standId?: string;
  search?: string;
}

type RawParam = string | string[] | undefined;

/** The value that the selects of the filter send for "no filter". */
export const ALL_FILTER_VALUE = "all";

const STATUSES: readonly AccountStatus[] = ["invited", "active", "disabled"];

const SEARCH_MAX_LENGTH = 120;

/** Reads the query string of the page; a value that is not a role or a status is ignored instead of failing. */
export function parseAccountFilter(params: Record<string, RawParam>): AccountAdminFilter {
  const role = ACCOUNT_ROLES.find((candidate) => candidate === readParam(params.role));
  const status = STATUSES.find((candidate) => candidate === readParam(params.status));

  return {
    role,
    status,
    standId: readStandParam(params.stand),
    search: readParam(params.q).slice(0, SEARCH_MAX_LENGTH) || undefined,
  };
}

function readStandParam(value: RawParam): string | undefined {
  const standId = readParam(value);

  return standId === ALL_FILTER_VALUE ? undefined : standId || undefined;
}

function readParam(value: RawParam): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}
