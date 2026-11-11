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

export function isPendingVisitResponse(value: unknown): value is PendingVisitResponse {
  return isObject(value) && "pending" in value && (value.pending === null || isPendingVisitView(value.pending));
}

export function isVisitStatusResponse(value: unknown): value is VisitStatusResponse {
  return isObject(value) && "status" in value && isVisitStatus(value.status);
}

function isPendingVisitView(value: unknown): value is PendingVisitView {
  return (
    isObject(value) &&
    "id" in value &&
    typeof value.id === "string" &&
    "standCode" in value &&
    typeof value.standCode === "string" &&
    "gameName" in value &&
    typeof value.gameName === "string"
  );
}

function isVisitStatus(value: unknown): value is VisitStatus {
  return value === "waiting" || value === "answered" || value === "expired";
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
