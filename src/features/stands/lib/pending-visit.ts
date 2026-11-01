export const PENDING_VISIT_API_PATH = "/api/visits/pending";

export const VISIT_STATUS_API_PATH = "/api/stand/visit-status";

/** What the passport shows while the staff waits for the ratings. */
export interface PendingVisitView {
  id: string;
  standCode: string;
  gameName: string;
}

export type VisitStatus = "waiting" | "answered" | "expired";

export interface PendingVisitResponse {
  pending: PendingVisitView | null;
}

export interface VisitStatusResponse {
  status: VisitStatus;
}

const VISIT_STATUSES: readonly unknown[] = ["waiting", "answered", "expired"];

export function isPendingVisitResponse(value: unknown): value is PendingVisitResponse {
  if (!isRecord(value) || !("pending" in value)) return false;

  const pending = value.pending;

  return (
    pending === null ||
    (isRecord(pending) &&
      typeof pending.id === "string" &&
      typeof pending.standCode === "string" &&
      typeof pending.gameName === "string")
  );
}

export function isVisitStatusResponse(value: unknown): value is VisitStatusResponse {
  return isRecord(value) && VISIT_STATUSES.includes(value.status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
