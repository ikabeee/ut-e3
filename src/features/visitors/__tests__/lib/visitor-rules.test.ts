import {
  buildVisitorQrUrl,
  clampScannedAt,
  CHECK_IN_BATCH_LIMIT,
  extractVisitorToken,
  normalizePhone,
  parseCheckInBatch,
  parseRaffleClaim,
  parseRaffleDraw,
  parseVisitorRegistration,
  pickRandom,
} from "@features/visitors/lib/visitor-rules";
import { ValidationError } from "@shared/lib/validation";

const TOKEN = "0123456789abcdef0123456789abcdef";
const CHECK_IN_ID = "6d94503f-3e3b-4e6e-8bc6-445cd33ed099";

function fieldErrors(run: () => unknown) {
  try {
    run();
  } catch (error) {
    if (error instanceof ValidationError) return error.fieldErrors;
    throw error;
  }
  return {};
}

describe("parseVisitorRegistration", () => {
  it("stores the gamertag in lowercase without the leading @", () => {
    expect(parseVisitorRegistration({ gamertag: "  @Neo_99 " })).toEqual({ gamertag: "neo_99" });
  });

  it("rejects accents, spaces and short gamertags", () => {
    const message = "Usa de 3 a 24 caracteres: letras sin acento, números, guion bajo, punto o guion.";
    expect(fieldErrors(() => parseVisitorRegistration({ gamertag: "Peña" }))).toEqual({ gamertag: message });
    expect(fieldErrors(() => parseVisitorRegistration({ gamertag: "neo 99" }))).toEqual({ gamertag: message });
    expect(fieldErrors(() => parseVisitorRegistration({ gamertag: "ab" }))).toEqual({ gamertag: message });
    expect(fieldErrors(() => parseVisitorRegistration({}))).toEqual({ gamertag: "El gamertag es obligatorio." });
  });
});

describe("normalizePhone and parseRaffleClaim", () => {
  it.each([
    ["998 123 4567", "+529981234567"],
    ["(998) 123-45-67", "+529981234567"],
    ["+52 998 123 4567", "+529981234567"],
    ["0015551234567", "+15551234567"],
  ])("normalizes %s", (raw, phone) => {
    expect(normalizePhone(raw)).toBe(phone);
    expect(parseRaffleClaim({ phone: raw })).toEqual({ phone });
  });

  it("rejects numbers that are not phones", () => {
    expect(fieldErrors(() => parseRaffleClaim({ phone: "12345" }))).toEqual({
      phone: "Escribe tu número a 10 dígitos o con lada internacional (+52...).",
    });
  });
});

describe("parseRaffleDraw", () => {
  it("accepts between 1 and 50 winners", () => {
    expect(parseRaffleDraw({ winners: "3" })).toEqual({ winners: 3 });
    expect(fieldErrors(() => parseRaffleDraw({ winners: 0 }))).toEqual({
      winners: "Los ganadores debe ser un número entero entre 1 y 50.",
    });
  });
});

describe("visitor QR", () => {
  it("builds the URL that the stand scanner reads", () => {
    expect(buildVisitorQrUrl("https://utg.example/", TOKEN)).toBe(`https://utg.example/v/${TOKEN}`);
  });

  it.each([
    [TOKEN, TOKEN],
    [`https://utg.example/v/${TOKEN}`, TOKEN],
    [`HTTPS://UTG.EXAMPLE/V/${TOKEN.toUpperCase()}`, TOKEN],
    [`https://utg.example/v/${TOKEN}?utm=qr`, TOKEN],
    ["https://utg.example/v/123", null],
    ["hola", null],
  ])("extracts the token from %s", (scanned, token) => {
    expect(extractVisitorToken(scanned)).toBe(token);
  });
});

describe("clampScannedAt", () => {
  const start = "2026-11-27T10:00:00-05:00";
  const now = new Date("2026-11-27T18:00:00.000Z");

  it("keeps the device time during the event", () => {
    expect(clampScannedAt("2026-11-27T17:30:00.000Z", start, now)).toBe("2026-11-27T17:30:00.000Z");
  });

  it("moves early clocks to the start and future clocks to the arrival time", () => {
    expect(clampScannedAt("2026-11-26T12:00:00.000Z", start, now)).toBe("2026-11-27T15:00:00.000Z");
    expect(clampScannedAt("2026-11-28T12:00:00.000Z", start, now)).toBe(now.toISOString());
  });

  it("never returns a time after the arrival, even before the event (rehearsals)", () => {
    const rehearsal = new Date("2026-11-20T12:00:00.000Z");
    expect(clampScannedAt("2026-11-20T11:59:00.000Z", start, rehearsal)).toBe(rehearsal.toISOString());
  });
});

describe("parseCheckInBatch", () => {
  const item = { id: CHECK_IN_ID.toUpperCase(), token: "texto mal leído", scannedAt: "2026-11-27T17:30:00Z" };

  it("keeps misread QR codes so they are answered as unknown", () => {
    expect(parseCheckInBatch({ checkIns: [item] })).toEqual([{ ...item, id: CHECK_IN_ID }]);
  });

  it("rejects empty or oversized batches and malformed items", () => {
    const batchError = { checkIns: `Envía de 1 a ${CHECK_IN_BATCH_LIMIT} escaneos en "checkIns".` };
    expect(fieldErrors(() => parseCheckInBatch({ checkIns: [] }))).toEqual(batchError);
    expect(fieldErrors(() => parseCheckInBatch(null))).toEqual(batchError);
    expect(fieldErrors(() => parseCheckInBatch({ checkIns: Array(CHECK_IN_BATCH_LIMIT + 1).fill(item) }))).toEqual(
      batchError,
    );
    expect(Object.keys(fieldErrors(() => parseCheckInBatch({ checkIns: [item, { ...item, id: "1" }] })))).toEqual([
      "checkIns.1",
    ]);
  });
});

describe("pickRandom", () => {
  it("picks distinct items using the given random source", () => {
    expect(pickRandom([1, 2, 3, 4], 2, () => 0)).toEqual([1, 2]);
    expect(pickRandom([1, 2, 3, 4], 2, (max) => max - 1)).toEqual([4, 1]);
  });

  it("returns every item when asking for more than there are", () => {
    expect(pickRandom(["a", "b"], 5, () => 0)).toEqual(["a", "b"]);
  });
});
