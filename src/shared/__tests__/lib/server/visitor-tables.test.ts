/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

describe("visitor registration tables", () => {
  it("rejects duplicate gamertag, email, and pinLookup case-insensitively for gamertag and email", async () => {
    await prisma.visitor.create({
      data: {
        fullName: "Thomas Anderson",
        gamertag: "Neo",
        email: "neo@matrix.org",
        pin: "enc_pin_1",
        pinLookup: "hmac_lookup_1",
      },
    });

    await expect(
      prisma.visitor.create({
        data: {
          fullName: "Duplicate Gamertag",
          gamertag: "neo",
          email: "other@matrix.org",
          pin: "enc_pin_2",
          pinLookup: "hmac_lookup_2",
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.visitor.create({
        data: {
          fullName: "Duplicate Email",
          gamertag: "OtherGamer",
          email: "NEO@MATRIX.ORG",
          pin: "enc_pin_3",
          pinLookup: "hmac_lookup_3",
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.visitor.create({
        data: {
          fullName: "Duplicate PinLookup",
          gamertag: "ThirdGamer",
          email: "third@matrix.org",
          pin: "enc_pin_4",
          pinLookup: "hmac_lookup_1",
        },
      }),
    ).rejects.toThrow();
  });

  it("allows only one active device per visitor and cascades device deletion when the visitor is deleted", async () => {
    const visitor = await prisma.visitor.create({
      data: {
        fullName: "Trinity",
        gamertag: "Trinity",
        email: "trinity@matrix.org",
        pin: "enc_pin_trinity",
        pinLookup: "hmac_lookup_trinity",
      },
    });

    await prisma.visitorDevice.create({
      data: {
        visitorId: visitor.id,
        token: "token_sha256_1",
      },
    });

    await expect(
      prisma.visitorDevice.create({
        data: {
          visitorId: visitor.id,
          token: "token_sha256_2",
        },
      }),
    ).rejects.toThrow();

    await prisma.visitor.delete({
      where: { id: visitor.id },
    });

    const devices = await prisma.visitorDevice.findMany({
      where: { visitorId: visitor.id },
    });

    expect(devices).toHaveLength(0);
  });

  it("rejects a duplicate blocklist email", async () => {
    await prisma.emailBlocklist.create({
      data: {
        email: "staff@matrix.org",
      },
    });

    await expect(
      prisma.emailBlocklist.create({
        data: {
          email: "staff@matrix.org",
        },
      }),
    ).rejects.toThrow();
  });

  it("creates an outbox row with default 0 attempts and a nextAttemptAt date", async () => {
    const before = new Date();

    const entry = await prisma.emailOutbox.create({
      data: {
        to: "visitor@matrix.org",
        subject: "Tu pasaporte UT Game Showcase",
        text: "Tu PIN es 04217",
      },
    });

    expect(entry.attempts).toBe(0);
    expect(entry.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(entry.sentAt).toBeNull();
    expect(entry.lastError).toBeNull();
  });
});
