import { queuedVisit } from "@features/stands/__tests__/lib/visit-queue-utils";
import {
  isQueuedVisitsRequest,
  isQueuedVisitsResponse,
  readQueuedVisitBatch,
} from "@features/stands/lib/queued-visit-input";

const ID = "0f8c7a1e-3b2d-4c5e-8f9a-0b1c2d3e4f5a";

describe("isQueuedVisitsRequest", () => {
  it("accepts a list of entries with an id", () => {
    expect(isQueuedVisitsRequest({ visits: [queuedVisit(ID)] })).toBe(true);
    expect(isQueuedVisitsRequest({ visits: [] })).toBe(true);
  });

  it("refuses a body without visits or with an entry that has no valid id", () => {
    expect(isQueuedVisitsRequest(null)).toBe(false);
    expect(isQueuedVisitsRequest({ visits: "x" })).toBe(false);
    expect(isQueuedVisitsRequest({ visits: [{ pin: "12345" }] })).toBe(false);
    expect(isQueuedVisitsRequest({ visits: [{ id: "a" }] })).toBe(false);
  });
});

describe("readQueuedVisitBatch", () => {
  it("reads each visit with its hour as a Date", () => {
    const batch = readQueuedVisitBatch({ visits: [queuedVisit(ID)] });

    expect(batch).toEqual({
      status: "ready",
      entries: [
        {
          id: ID,
          visit: {
            id: ID,
            pin: "12345",
            ratings: { gameRating: 4, standRating: 5, artRating: 3 },
            scannedAt: new Date("2026-11-20T20:00:00.000Z"),
          },
        },
      ],
    });
  });

  it("keeps an entry that is not a visit, to refuse it on its own", () => {
    const broken = [
      { ...queuedVisit(ID), pin: "1234" },
      { ...queuedVisit(ID), ratings: { gameRating: 6, standRating: 5, artRating: 3 } },
      { ...queuedVisit(ID), scannedAt: "ayer" },
    ];

    const batch = readQueuedVisitBatch({ visits: broken });

    expect(batch.status === "ready" && batch.entries.map((entry) => entry.visit)).toEqual([null, null, null]);
  });

  it("refuses a batch of 51 visits (UT-CI-15)", () => {
    const visits = Array.from({ length: 51 }, () => queuedVisit(ID));

    expect(readQueuedVisitBatch({ visits })).toEqual({ status: "tooLarge" });
  });
});

describe("isQueuedVisitsResponse", () => {
  it("accepts the known statuses only", () => {
    expect(isQueuedVisitsResponse({ results: [{ id: ID, status: "late" }] })).toBe(true);
    expect(isQueuedVisitsResponse({ results: [{ id: ID, status: "maybe" }] })).toBe(false);
    expect(isQueuedVisitsResponse({})).toBe(false);
  });
});
