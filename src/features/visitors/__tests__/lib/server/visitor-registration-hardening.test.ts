/**
 * @jest-environment node
 */
import {
  generateUniquePin,
  mapUniqueViolation,
  MAX_PIN_ATTEMPTS,
  registerVisitorRecord,
} from "@features/visitors/lib/server/visitor-registration";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = TEST_KEY;

const NOW = new Date("2026-11-20T17:00:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().emailBlocklist.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().account.deleteMany();
});

describe("mapUniqueViolation", () => {
  it("maps gamertag target to gamertagTaken status", () => {
    expect(mapUniqueViolation("gamertag")).toEqual({ status: "gamertagTaken" });
    expect(mapUniqueViolation(["gamertag"])).toEqual({ status: "gamertagTaken" });
    expect(mapUniqueViolation("visitors_gamertag_key")).toEqual({ status: "gamertagTaken" });
  });

  it("maps email target to blocked status", () => {
    expect(mapUniqueViolation("email")).toEqual({ status: "blocked" });
    expect(mapUniqueViolation(["email"])).toEqual({ status: "blocked" });
    expect(mapUniqueViolation("visitors_email_key")).toEqual({ status: "blocked" });
  });

  it("maps pin_hmac target to retryPin status", () => {
    expect(mapUniqueViolation("pin_hmac")).toEqual({ status: "retryPin" });
    expect(mapUniqueViolation(["pin_hmac"])).toEqual({ status: "retryPin" });
    expect(mapUniqueViolation("visitors_pin_hmac_key")).toEqual({ status: "retryPin" });
    expect(mapUniqueViolation("pinLookup")).toEqual({ status: "retryPin" });
  });

  it("returns null for unknown or unhandled targets", () => {
    expect(mapUniqueViolation("id")).toBeNull();
    expect(mapUniqueViolation([])).toBeNull();
    expect(mapUniqueViolation(null)).toBeNull();
    expect(mapUniqueViolation(undefined)).toBeNull();
  });
});

describe("registerVisitorRecord duplicate handling", () => {
  it("returns gamertagTaken status when registering with a pre-existing gamertag instead of throwing", async () => {
    await registerVisitorRecord(
      {
        fullName: "Existing Player",
        gamertag: "SpeedRunner",
        email: "runner@ut.mx",
      },
      NOW,
    );

    const duplicateResult = await registerVisitorRecord(
      {
        fullName: "Another Player",
        gamertag: "SpeedRunner",
        email: "other@ut.mx",
      },
      NOW,
    );

    expect(duplicateResult).toEqual({ status: "gamertagTaken" });
  });

  it("returns blocked status when registering with a pre-existing email instead of throwing", async () => {
    await registerVisitorRecord(
      {
        fullName: "Existing Player",
        gamertag: "GamerOne",
        email: "duplicate@ut.mx",
      },
      NOW,
    );

    const duplicateResult = await registerVisitorRecord(
      {
        fullName: "Another Player",
        gamertag: "GamerTwo",
        email: "duplicate@ut.mx",
      },
      NOW,
    );

    expect(duplicateResult).toEqual({ status: "blocked" });
  });
});

describe("generateUniquePin", () => {
  it("stops after 20 attempts and throws an Error with a clear English message", async () => {
    const fixedCollidingPin = "42424";
    const collidingPinLookup = hashPinForLookup(fixedCollidingPin);

    await getPrisma().visitor.create({
      data: {
        fullName: "Pre-existing Visitor",
        gamertag: "PinnedGamer",
        email: "pinned@ut.mx",
        pin: "encrypted-pin-placeholder",
        pinLookup: collidingPinLookup,
        createdAt: NOW,
      },
    });

    let attempts = 0;

    const fixedRandomSource = () => {
      attempts++;

      return fixedCollidingPin;
    };

    await expect(
      getPrisma().$transaction(async (tx) => {
        return generateUniquePin(tx, fixedRandomSource);
      }),
    ).rejects.toThrow("Unable to generate a unique PIN after 20 attempts.");

    expect(attempts).toBe(MAX_PIN_ATTEMPTS);
  });

  it("generates a pin successfully when a random collision is resolved on subsequent attempt", async () => {
    const collidingPin = "11111";
    const availablePin = "22222";

    await getPrisma().visitor.create({
      data: {
        fullName: "Pre-existing Visitor",
        gamertag: "Collider",
        email: "collider@ut.mx",
        pin: "encrypted-pin-placeholder",
        pinLookup: hashPinForLookup(collidingPin),
        createdAt: NOW,
      },
    });

    const sequence = [collidingPin, availablePin];
    const sequenceRandomSource = () => sequence.shift() ?? availablePin;

    const result = await getPrisma().$transaction(async (tx) => {
      return generateUniquePin(tx, sequenceRandomSource);
    });

    expect(result.pin).toBe(availablePin);
    expect(result.pinLookup).toBe(hashPinForLookup(availablePin));
    expect(result.encryptedPin).toBeTruthy();
  });
});
