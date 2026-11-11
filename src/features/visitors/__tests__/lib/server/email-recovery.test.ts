/**
 * @jest-environment node
 */
import {
  claimRecoveryToken,
  isUsableRecoveryToken,
  RECOVERY_LINK_LIFETIME_MS,
  requestEmailRecovery,
} from "@features/visitors/lib/server/email-recovery";
import { CLAIM_PATH } from "@features/visitors/lib/visitors-links";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createVisitorDevice, isActiveDeviceToken } from "@shared/lib/server/visitor-device";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const NOW = new Date("2026-11-20T18:00:00.000Z");

const MINUTE = 60 * 1000;

let visitorId = "";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().recoveryToken.deleteMany();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  visitorId = (
    await getPrisma().visitor.create({
      data: {
        fullName: "Ana Pérez",
        gamertag: "Neo_01",
        email: "neo@example.com",
        pin: encryptPin("12345"),
        pinLookup: hashPinForLookup("12345"),
      },
    })
  ).id;
});

describe("requestEmailRecovery", () => {
  it("queues an email only for a registered email (UT-VI-09)", async () => {
    expect(await requestEmailRecovery("nadie@example.com", NOW)).toBeNull();
    expect(await requestEmailRecovery("neo@example.com", NOW)).toEqual(expect.any(String));

    const outbox = await getPrisma().emailOutbox.findMany();

    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe("neo@example.com");
  });

  it("refuses the fourth request of the same email in an hour, even for an email without a passport (UT-VI-10)", async () => {
    for (let request = 0; request < 3; request++) {
      expect(await requestEmailRecovery("neo@example.com", NOW)).not.toBeNull();
    }

    expect(await requestEmailRecovery("neo@example.com", NOW)).toBeNull();
    expect(await getPrisma().emailOutbox.count()).toBe(3);
    expect(await getPrisma().rateLimit.findFirst({ where: { key: "recovery-email:neo@example.com" } })).toMatchObject({
      count: 4,
    });

    await requestEmailRecovery("nadie@example.com", NOW);
    expect(await getPrisma().rateLimit.findFirst({ where: { key: "recovery-email:nadie@example.com" } })).toMatchObject(
      { count: 1 },
    );
  });

  it("sends only the one-use link, never the PIN, gamertag or name (UT-VI-15, RF-71)", async () => {
    await requestEmailRecovery("neo@example.com", NOW);

    const { text, subject } = await getPrisma().emailOutbox.findFirstOrThrow();
    const links = text.match(/https?:\/\/\S+/g) ?? [];

    expect(links).toHaveLength(1);
    expect(links[0]).toContain(`${CLAIM_PATH}/`);
    expect(`${subject} ${text}`).not.toMatch(/12345|Neo_01|Ana/);
  });

  it("stores only the hash of the token, for the email channel, expiring in 30 minutes", async () => {
    await requestEmailRecovery("neo@example.com", NOW);

    const { text } = await getPrisma().emailOutbox.findFirstOrThrow();
    const row = await getPrisma().recoveryToken.findFirstOrThrow();

    expect(text).not.toContain(row.token);
    expect(row).toMatchObject({ visitorId, channel: "email", issuedById: null, usedAt: null });
    expect(row.expiresAt.getTime() - NOW.getTime()).toBe(RECOVERY_LINK_LIFETIME_MS);
  });
});

describe("claimRecoveryToken", () => {
  it("accepts a link of 29 minutes: the new device works and the old one stops (UT-VI-11, UT-VI-19)", async () => {
    const oldDevice = await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));
    const token = await requestLink();

    const newDevice = await claimRecoveryToken(token, new Date(NOW.getTime() + 29 * MINUTE));

    expect(newDevice).toEqual(expect.any(String));
    expect(await isActiveDeviceToken(newDevice ?? "")).toBe(true);
    expect(await isActiveDeviceToken(oldDevice)).toBe(false);

    const visitor = await getPrisma().visitor.findUniqueOrThrow({ where: { id: visitorId } });

    expect(visitor.pinLookup).toBe(hashPinForLookup("12345"));
  });

  it("records the recovery in the audit log without an agent (RF-70)", async () => {
    const token = await requestLink();

    await claimRecoveryToken(token, NOW);

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "passport_recovered", entityId: visitorId },
    });

    expect(entry).toMatchObject({ actorId: null, entityType: "visitor", detail: { channel: "email" } });
  });

  it("refuses a link of 31 minutes (UT-VI-12)", async () => {
    const token = await requestLink();
    const later = new Date(NOW.getTime() + 31 * MINUTE);

    expect(await isUsableRecoveryToken(token, later)).toBe(false);
    expect(await claimRecoveryToken(token, later)).toBeNull();
  });

  it("refuses a link that was already used, also when two phones open it at once (UT-VI-12)", async () => {
    const token = await requestLink();

    const results = await Promise.all([claimRecoveryToken(token, NOW), claimRecoveryToken(token, NOW)]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await claimRecoveryToken(token, NOW)).toBeNull();
    expect(await isUsableRecoveryToken(token, NOW)).toBe(false);
  });

  it("closes the other pending links once one of them recovers the passport", async () => {
    await requestEmailRecovery("neo@example.com", NOW);
    await requestEmailRecovery("neo@example.com", NOW);

    const [older, newer] = (await getPrisma().emailOutbox.findMany()).map(({ text }) => readLinkToken(text));

    expect(older).not.toBe(newer);
    expect(await claimRecoveryToken(newer, NOW)).not.toBeNull();
    expect(await isUsableRecoveryToken(older, NOW)).toBe(false);
    expect(await claimRecoveryToken(older, NOW)).toBeNull();
  });

  it("closes the pending email links when the help desk gives the passport a new device (RF-70)", async () => {
    const token = await requestLink();

    await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    expect(await isUsableRecoveryToken(token, NOW)).toBe(false);
    expect(await claimRecoveryToken(token, NOW)).toBeNull();
  });

  it("refuses a made-up link and does not touch the device", async () => {
    const device = await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    expect(await claimRecoveryToken("no-existe", NOW)).toBeNull();
    expect(await isActiveDeviceToken(device)).toBe(true);
  });

  it("checking a link does not use it", async () => {
    const token = await requestLink();

    expect(await isUsableRecoveryToken(token, NOW)).toBe(true);
    expect(await isUsableRecoveryToken(token, NOW)).toBe(true);
    expect(await claimRecoveryToken(token, NOW)).not.toBeNull();
  });
});

describe("recovery_tokens constraints", () => {
  it("refuses a help desk token without an agent (UT-VI-14)", async () => {
    await expect(
      getPrisma().recoveryToken.create({
        data: { visitorId, token: "a".repeat(64), channel: "help_desk", expiresAt: NOW },
      }),
    ).rejects.toThrow();
  });

  it("refuses an unknown channel", async () => {
    await expect(
      getPrisma().recoveryToken.create({
        data: { visitorId, token: "b".repeat(64), channel: "sms", expiresAt: NOW },
      }),
    ).rejects.toThrow();
  });
});

// The token only exists in the email, so the test reads it from the link of the queued message.
async function requestLink(): Promise<string> {
  await requestEmailRecovery("neo@example.com", NOW);

  const { text } = await getPrisma().emailOutbox.findFirstOrThrow({ orderBy: { createdAt: "desc" } });

  return readLinkToken(text);
}

function readLinkToken(text: string): string {
  return new RegExp(`${CLAIM_PATH}/(\\S+)`).exec(text)?.[1] ?? "";
}
