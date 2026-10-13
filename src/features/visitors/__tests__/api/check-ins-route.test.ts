/**
 * @jest-environment node
 */
import { GET, POST, SCANNER_KEY_HEADER } from "@features/visitors/api/check-ins-route";
import { findScannerGame, recordCheckIns } from "@features/visitors/lib/server/check-ins-queries";

jest.mock("@features/visitors/lib/server/check-ins-queries", () => ({
  findScannerGame: jest.fn(),
  recordCheckIns: jest.fn(),
}));

const KEY = "0123456789abcdef0123456789abcdef";

const SCAN = { id: "6d94503f-3e3b-4e6e-8bc6-445cd33ed099", token: "qr", scannedAt: "2026-11-27T17:30:00Z" };

function request(method: "GET" | "POST", body?: unknown, key: string | null = KEY) {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);

  return new Request("http://localhost/api/check-ins", {
    method,
    headers: key ? { [SCANNER_KEY_HEADER]: key } : {},
    body: body === undefined ? undefined : rawBody,
  });
}

describe("/api/check-ins", () => {
  beforeEach(() => {
    jest
      .mocked(findScannerGame)
      .mockImplementation(async (key) =>
        key === KEY ? { gameId: "game-1", gameName: "Ruta 9", standCode: "A4" } : null,
      );
    jest.mocked(recordCheckIns).mockResolvedValue([{ id: SCAN.id, status: "created" }]);
  });

  it("tells the scanner which game it records", async () => {
    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ game: { name: "Ruta 9", standCode: "A4" } });
  });

  it("rejects a missing or unknown scanner key", async () => {
    expect((await GET(request("GET", undefined, null))).status).toBe(401);
    expect((await POST(request("POST", { checkIns: [SCAN] }, "f".repeat(32)))).status).toBe(401);
    expect(recordCheckIns).not.toHaveBeenCalled();
  });

  it("records the batch for the game of the key and answers each scan", async () => {
    const response = await POST(request("POST", { checkIns: [SCAN] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      game: { name: "Ruta 9", standCode: "A4" },
      results: [{ id: SCAN.id, status: "created" }],
    });
    expect(recordCheckIns).toHaveBeenCalledWith("game-1", [SCAN]);
  });

  it("answers 400 to a body that is not JSON or not a valid batch", async () => {
    expect((await POST(request("POST", "{"))).status).toBe(400);

    const response = await POST(request("POST", { checkIns: [] }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ fieldErrors: { checkIns: expect.any(String) } });
  });
});
