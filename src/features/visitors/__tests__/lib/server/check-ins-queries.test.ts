/**
 * @jest-environment node
 */
import { recordCheckIns } from "@features/visitors/lib/server/check-ins-queries";
import { db } from "@shared/lib/prisma/db";
import { hashSecret } from "@shared/lib/server/secrets";

// Prisma con lo mínimo que usa `recordCheckIns`: la búsqueda de visitantes por hash del token y
// el `INSERT ... ON CONFLICT DO NOTHING`, que devuelve sólo las filas que sí se insertaron.
const mockVisitors: { id: string; qrTokenHash: string }[] = [];
const mockAlreadyStored = new Set<string>();
const mockCreateAll = jest.fn(async (rows: { id: string }[]) => rows.filter((row) => !mockAlreadyStored.has(row.id)));

jest.mock("@shared/lib/prisma/db", () => ({
  db: {
    orm: {
      public: {
        Visitor: { select: () => ({ where: () => ({ all: async () => mockVisitors }) }) },
        CheckIn: { select: () => ({ createAll: mockCreateAll }) },
      },
    },
  },
}));

const TOKEN = "0123456789abcdef0123456789abcdef";

const scan = (id: string, token: string) => ({ id, token, scannedAt: "2026-11-27T17:30:00Z" });

describe("recordCheckIns", () => {
  beforeEach(() => {
    mockVisitors.splice(0, mockVisitors.length, { id: "visitor-1", qrTokenHash: hashSecret(TOKEN) });
    mockAlreadyStored.clear();
    mockCreateAll.mockClear();
  });

  it("stores the scans of known visitors and reports created, duplicate and unknown", async () => {
    mockAlreadyStored.add("scan-2");

    const results = await recordCheckIns(
      "game-1",
      [scan("scan-1", `https://showcase.example/v/${TOKEN}`), scan("scan-2", TOKEN), scan("scan-3", "not a qr")],
      new Date("2026-11-27T18:00:00Z"),
    );

    expect(results).toEqual([
      { id: "scan-1", status: "created" },
      { id: "scan-2", status: "duplicate" },
      { id: "scan-3", status: "unknown" },
    ]);
    expect(mockCreateAll).toHaveBeenCalledWith(
      [
        { id: "scan-1", visitorId: "visitor-1", gameId: "game-1", scannedAt: "2026-11-27T17:30:00.000Z" },
        { id: "scan-2", visitorId: "visitor-1", gameId: "game-1", scannedAt: "2026-11-27T17:30:00.000Z" },
      ],
      { onConflict: "skip" },
    );
  });

  it("does not query or insert anything when no scan is a visitor QR", async () => {
    const select = jest.spyOn(db.orm.public.Visitor, "select");

    const results = await recordCheckIns("game-1", [scan("scan-1", "not a qr")]);

    expect(results).toEqual([{ id: "scan-1", status: "unknown" }]);
    expect(select).not.toHaveBeenCalled();
    expect(mockCreateAll).not.toHaveBeenCalled();
  });
});
