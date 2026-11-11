import { parsePin, type Ratings } from "@features/stands/lib/survey-input";
import {
  MAX_QUEUE_BATCH,
  type QueuedVisit,
  type QueuedVisitResult,
  type QueuedVisitStatus,
} from "@features/stands/lib/visit-queue";

/** A queued visit as the server reads it. */
export interface ReceivedQueuedVisit {
  id: string;
  pin: string;
  ratings: Ratings;
  scannedAt: Date;
}

/** One entry of a batch: `visit` is null when the entry does not have the shape of a visit, and it is refused. */
export interface ReceivedEntry {
  id: string;
  visit: ReceivedQueuedVisit | null;
}

export type ReceivedBatch = { status: "ready"; entries: ReceivedEntry[] } | { status: "tooLarge" };

/** The body of `POST /api/stand/queued-visits`. Each entry has at least its id, so the kiosk can match the answer. */
export interface QueuedVisitsRequest {
  visits: QueuedVisitEnvelope[];
}

export interface QueuedVisitEnvelope {
  id: string;
}

export interface QueuedVisitsResponse {
  results: QueuedVisitResult[];
}

const VISIT_ID_FORMAT = /^[0-9a-f-]{36}$/;

const STATUSES: readonly QueuedVisitStatus[] = [
  "ok",
  "duplicate",
  "late",
  "unknownVisitor",
  "standWithoutGame",
  "invalid",
];

/** Whether the body has a list of entries with an id; without ids the kiosk could not match the answers. */
export function isQueuedVisitsRequest(value: unknown): value is QueuedVisitsRequest {
  return isObject(value) && "visits" in value && Array.isArray(value.visits) && value.visits.every(isEnvelope);
}

/** The entries of a batch of at most 50 visits (RF-35); an entry that is not a visit is kept to be refused. */
export function readQueuedVisitBatch(request: QueuedVisitsRequest): ReceivedBatch {
  if (request.visits.length > MAX_QUEUE_BATCH) return { status: "tooLarge" };

  return { status: "ready", entries: request.visits.map(toEntry) };
}

export function isQueuedVisitsResponse(value: unknown): value is QueuedVisitsResponse {
  return isObject(value) && "results" in value && Array.isArray(value.results) && value.results.every(isResult);
}

function isEnvelope(value: unknown): value is QueuedVisitEnvelope {
  return isObject(value) && "id" in value && typeof value.id === "string" && VISIT_ID_FORMAT.test(value.id);
}

function toEntry(envelope: QueuedVisitEnvelope): ReceivedEntry {
  if (!isQueuedVisit(envelope)) return { id: envelope.id, visit: null };

  const { id, pin, ratings, scannedAt } = envelope;

  return { id, visit: { id, pin, ratings, scannedAt: new Date(scannedAt) } };
}

function isQueuedVisit(envelope: QueuedVisitEnvelope): envelope is QueuedVisit {
  return (
    "pin" in envelope &&
    typeof envelope.pin === "string" &&
    parsePin(envelope.pin) === envelope.pin &&
    "ratings" in envelope &&
    isRatings(envelope.ratings) &&
    "scannedAt" in envelope &&
    typeof envelope.scannedAt === "string" &&
    !Number.isNaN(Date.parse(envelope.scannedAt))
  );
}

function isRatings(value: unknown): value is Ratings {
  return (
    isObject(value) &&
    "gameRating" in value &&
    isRating(value.gameRating) &&
    "standRating" in value &&
    isRating(value.standRating) &&
    "artRating" in value &&
    isRating(value.artRating)
  );
}

function isRating(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

function isResult(value: unknown): value is QueuedVisitResult {
  return (
    isObject(value) &&
    "id" in value &&
    typeof value.id === "string" &&
    "status" in value &&
    STATUSES.some((status) => status === value.status)
  );
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
