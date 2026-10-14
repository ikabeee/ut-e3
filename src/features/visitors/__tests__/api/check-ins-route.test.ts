/**
 * @jest-environment node
 */
import { createCheckInsRoute, SCANNER_KEY_HEADER } from "@features/visitors/api/check-ins-route";
import type { CheckInBatchPayload } from "@features/visitors/lib/visitor-rules";

const KEY = "0123456789abcdef0123456789abcdef";

const SCAN = { id: "6d94503f-3e3b-4e6e-8bc6-445cd33ed099", token: "qr", scannedAt: "2026-11-27T17:30:00Z" };

function isString(value: string | CheckInBatchPayload): value is string {
  return typeof value === "string";
}

function getRequest(key: string | null = KEY) {
  return new Request("http://localhost/api/check-ins", {
    method: "GET",
    headers: key ? { [SCANNER_KEY_HEADER]: key } : {},
  });
}

function postRequest(body: string | CheckInBatchPayload, key: string | null = KEY) {
  const rawBody = isString(body) ? body : JSON.stringify(body);

  return new Request("http://localhost/api/check-ins", {
    method: "POST",
    headers: key ? { [SCANNER_KEY_HEADER]: key } : {},
    body: rawBody,
  });
}

describe("/api/check-ins", () => {
  const findScannerGameMock = jest.fn();
  const recordCheckInsMock = jest.fn();

  const { GET, POST } = createCheckInsRoute({
    findGame: findScannerGameMock,
    saveCheckIns: recordCheckInsMock,
  });

  beforeEach(() => {
    findScannerGameMock.mockReset();
    recordCheckInsMock.mockReset();
    findScannerGameMock.mockImplementation(async (key: string) =>
      key === KEY ? { gameId: "game-1", gameName: "Ruta 9", standCode: "A4" } : null,
    );
    recordCheckInsMock.mockResolvedValue([{ id: SCAN.id, status: "created" }]);
  });

  it("tells the scanner which game it records", async () => {
    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ game: { name: "Ruta 9", standCode: "A4" } });
  });

  it("rejects a missing or unknown scanner key", async () => {
    expect((await GET(getRequest(null))).status).toBe(401);
    expect((await POST(postRequest({ checkIns: [SCAN] }, "f".repeat(32)))).status).toBe(401);
    expect(recordCheckInsMock).not.toHaveBeenCalled();
  });

  it("records the batch for the game of the key and answers each scan", async () => {
    const response = await POST(postRequest({ checkIns: [SCAN] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      game: { name: "Ruta 9", standCode: "A4" },
      results: [{ id: SCAN.id, status: "created" }],
    });
    expect(recordCheckInsMock).toHaveBeenCalledWith("game-1", [SCAN]);
  });

  it("answers 400 to a body that is not JSON or not a valid batch", async () => {
    expect((await POST(postRequest("{"))).status).toBe(400);

    const response = await POST(postRequest({ checkIns: [] }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ fieldErrors: { checkIns: expect.any(String) } });
  });
});
