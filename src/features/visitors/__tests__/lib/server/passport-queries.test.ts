/**
 * @jest-environment node
 */
import { getPassport } from "@features/visitors/lib/server/passport-queries";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = TEST_KEY;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
});

describe("getPassport", () => {
  it("returns gamertag and the decrypted PIN for a valid visitor", async () => {
    const rawPin = "54321";
    const encryptedPin = encryptPin(rawPin);
    const pinLookup = hashPinForLookup(rawPin);

    const visitor = await getPrisma().visitor.create({
      data: {
        fullName: "Thomas Anderson",
        gamertag: "Neo",
        email: "neo@matrix.org",
        pin: encryptedPin,
        pinLookup,
      },
    });

    const result = await getPassport(visitor.id);

    expect(result).toEqual({
      gamertag: "Neo",
      pin: "54321",
    });
  });

  it("returns null for an unknown id", async () => {
    const result = await getPassport("non-existent-visitor-id");

    expect(result).toBeNull();
  });
});
