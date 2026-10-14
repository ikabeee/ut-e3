/**
 * @jest-environment node
 */
import { type CheckInRow, recordCheckIns } from "@features/visitors/lib/server/check-ins-queries";
import { hashSecret } from "@shared/lib/server/secrets";

const mockVisitors: { id: string; qrTokenHash: string }[] = [];

const mockAlreadyStored = new Set<string>();

const mockCreateAll = jest.fn(
  async (rows: CheckInRow[]) => new Set(rows.flatMap((row) => (mockAlreadyStored.has(row.id) ? [] : [row.id]))),
);

const findVisitorIdsMock = jest.fn(async (hashes: string[]) => {
  const map = new Map<string, string>();

  for (const visitor of mockVisitors) {
    if (hashes.includes(visitor.qrTokenHash)) {
      map.set(visitor.qrTokenHash, visitor.id);
    }
  }

  return map;
});

const deps = {
  findVisitorIds: findVisitorIdsMock,
  insertRows: mockCreateAll,
};

const TOKEN = "0123456789abcdef0123456789abcdef";

const scan = (id: string, token: string) => ({ id, token, scannedAt: "2026-11-27T17:30:00Z" });

describe("recordCheckIns", () => {
  beforeEach(() => {
    mockVisitors.splice(0, mockVisitors.length, { id: "visitor-1", qrTokenHash: hashSecret(TOKEN) });
    mockAlreadyStored.clear();
    mockCreateAll.mockClear();
    findVisitorIdsMock.mockClear();
  });

  it("stores the scans of known visitors and reports created, duplicate and unknown", async () => {
    mockAlreadyStored.add("scan-2");

    const results = await recordCheckIns(
      "game-1",
      [scan("scan-1", `https://showcase.example/v/${TOKEN}`), scan("scan-2", TOKEN), scan("scan-3", "not a qr")],
      new Date("2026-11-27T18:00:00Z"),
      deps,
    );

    expect(results).toEqual([
      { id: "scan-1", status: "created" },
      { id: "scan-2", status: "duplicate" },
      { id: "scan-3", status: "unknown" },
    ]);
    expect(mockCreateAll).toHaveBeenCalledWith([
      { id: "scan-1", visitorId: "visitor-1", gameId: "game-1", scannedAt: "2026-11-27T17:30:00.000Z" },
      { id: "scan-2", visitorId: "visitor-1", gameId: "game-1", scannedAt: "2026-11-27T17:30:00.000Z" },
    ]);
  });

  it("does not query or insert anything when no scan is a visitor QR", async () => {
    const results = await recordCheckIns("game-1", [scan("scan-1", "not a qr")], new Date(), deps);

    expect(results).toEqual([{ id: "scan-1", status: "unknown" }]);
    expect(findVisitorIdsMock).not.toHaveBeenCalled();
    expect(mockCreateAll).not.toHaveBeenCalled();
  });
});
