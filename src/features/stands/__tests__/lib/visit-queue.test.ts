/**
 * @jest-environment node
 */
import { queuedVisit } from "@features/stands/__tests__/lib/visit-queue-utils";
import {
  buildBatches,
  createVisitId,
  getRetryDelay,
  MAX_QUEUE_BATCH,
  settleBatch,
} from "@features/stands/lib/visit-queue";

describe("settleBatch", () => {
  it("takes ok and duplicate out as sent and moves late to the rejected list with its reason (UT-CI-20)", () => {
    const batch = [queuedVisit("a"), queuedVisit("b"), queuedVisit("c", "11111", "2026-11-20T21:49:00.000Z")];

    const settled = settleBatch(batch, [
      { id: "a", status: "ok" },
      { id: "b", status: "duplicate" },
      { id: "c", status: "late" },
    ]);

    expect(settled.settledIds).toEqual(["a", "b", "c"]);
    expect(settled.rejected).toEqual([{ id: "c", reason: "late", scannedAt: "2026-11-20T21:49:00.000Z" }]);
  });

  it("keeps in the queue a visit the answer leaves out", () => {
    const settled = settleBatch([queuedVisit("a"), queuedVisit("b")], [{ id: "a", status: "unknownVisitor" }]);

    expect(settled.settledIds).toEqual(["a"]);
    expect(settled.rejected).toEqual([expect.objectContaining({ id: "a", reason: "unknownVisitor" })]);
  });
});

describe("buildBatches", () => {
  it("splits 60 visits in batches of at most 50, in the order of the PINs (UT-CI-21)", () => {
    const visits = Array.from({ length: 60 }, (_, index) =>
      queuedVisit(`v${index}`, "12345", new Date(Date.UTC(2026, 10, 20, 20, 59 - index)).toISOString()),
    );

    const batches = buildBatches(visits);

    expect(batches.map((batch) => batch.length)).toEqual([MAX_QUEUE_BATCH, 10]);
    expect(batches[0][0].id).toBe("v59");
    expect(batches[1].at(-1)?.id).toBe("v0");
  });

  it("gives no batch for an empty queue", () => {
    expect(buildBatches([])).toEqual([]);
  });
});

describe("getRetryDelay", () => {
  it("doubles the ceiling with each failure and adds jitter in its upper half", () => {
    expect(getRetryDelay(1, () => 0)).toBe(500);
    expect(getRetryDelay(1, () => 1)).toBe(1000);
    expect(getRetryDelay(3, () => 0)).toBe(2000);
    expect(getRetryDelay(3, () => 1)).toBe(4000);
  });

  it("never waits more than a minute", () => {
    expect(getRetryDelay(30, () => 1)).toBe(60_000);
  });
});

describe("createVisitId", () => {
  it("builds a version 4 UUID without randomUUID (a kiosk on an HTTP address)", () => {
    expect(createVisitId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(createVisitId()).not.toBe(createVisitId());
  });
});
