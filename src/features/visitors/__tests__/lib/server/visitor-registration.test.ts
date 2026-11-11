/**
 * @jest-environment node
 */
import { createHash } from "node:crypto";
import { registerVisitorRecord } from "@features/visitors/lib/server/visitor-registration";
import { decryptPin } from "@shared/lib/server/pin-cipher";
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

describe("registerVisitorRecord", () => {
  it("registers a visitor, generates a decryptable 5-digit PIN, device token, outbox email, and audit log", async () => {
    const result = await registerVisitorRecord(
      {
        fullName: "Thomas Anderson",
        gamertag: "Neo",
        email: "neo@matrix.org",
      },
      NOW,
    );

    expect(result).toEqual({
      status: "created",
      visitorId: expect.any(String),
      deviceToken: expect.any(String),
      emailId: expect.any(String),
    });

    if (result.status !== "created") return;

    const visitor = await getPrisma().visitor.findUnique({
      where: { id: result.visitorId },
    });

    expect(visitor).not.toBeNull();
    expect(visitor?.fullName).toBe("Thomas Anderson");
    expect(visitor?.gamertag).toBe("Neo");
    expect(visitor?.email).toBe("neo@matrix.org");

    const pin = decryptPin(visitor?.pin ?? "");

    expect(pin).toMatch(/^\d{5}$/);

    const devices = await getPrisma().visitorDevice.findMany({
      where: { visitorId: result.visitorId },
    });

    expect(devices).toHaveLength(1);
    expect(devices[0].token).toBe(sha256(result.deviceToken));

    const email = await getPrisma().emailOutbox.findUnique({
      where: { id: result.emailId },
    });

    expect(email).not.toBeNull();
    expect(email?.to).toBe("neo@matrix.org");
    expect(email?.text).toContain(pin);
    expect(email?.text).toContain("Neo");
    expect(email?.text).toContain("/passport");

    const auditLogs = await getPrisma().auditLog.findMany({
      where: { entityId: result.visitorId },
    });

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe("visitor.register");
    expect(auditLogs[0].entityType).toBe("visitor");

    const auditDetail = JSON.stringify(auditLogs[0].detail);

    expect(auditDetail).toContain("Neo");
    expect(auditDetail).not.toContain(pin);
    expect(auditDetail).not.toContain("neo@matrix.org");
  });

  it("blocks registration when email is in email_blocklist (case-insensitive)", async () => {
    await getPrisma().emailBlocklist.create({
      data: { email: "staff@matrix.org" },
    });

    const result = await registerVisitorRecord(
      {
        fullName: "Staff Member",
        gamertag: "StaffGamer",
        email: "STAFF@Matrix.Org",
      },
      NOW,
    );

    expect(result).toEqual({ status: "blocked" });
  });

  it("blocks registration when email belongs to an account (case-insensitive)", async () => {
    await getPrisma().account.create({
      data: {
        id: "sysadmin-1",
        email: "admin@ut.mx",
        name: "Admin User",
        role: "sysadmin",
        status: "active",
        password: "scrypt-hash-placeholder",
      },
    });

    const result = await registerVisitorRecord(
      {
        fullName: "Impostor",
        gamertag: "ImpostorGamer",
        email: "ADMIN@ut.mx",
      },
      NOW,
    );

    expect(result).toEqual({ status: "blocked" });
  });

  it("blocks registration when email is already registered by another visitor (case-insensitive)", async () => {
    await registerVisitorRecord(
      {
        fullName: "First Visitor",
        gamertag: "OriginalGamer",
        email: "visitor@ut.mx",
      },
      NOW,
    );

    const result = await registerVisitorRecord(
      {
        fullName: "Second Visitor",
        gamertag: "NewGamer",
        email: "VISITOR@UT.MX",
      },
      NOW,
    );

    expect(result).toEqual({ status: "blocked" });
  });

  it("returns gamertagTaken when gamertag already exists case-insensitively (Neo vs neo)", async () => {
    await registerVisitorRecord(
      {
        fullName: "First Visitor",
        gamertag: "Neo",
        email: "first@ut.mx",
      },
      NOW,
    );

    const result = await registerVisitorRecord(
      {
        fullName: "Second Visitor",
        gamertag: "neo",
        email: "second@ut.mx",
      },
      NOW,
    );

    expect(result).toEqual({ status: "gamertagTaken" });
  });

  it("writes nothing to visitors, visitor_devices, email_outbox, or audit_logs when registration is blocked", async () => {
    await getPrisma().emailBlocklist.create({
      data: { email: "blocked@ut.mx" },
    });

    const beforeVisitors = await getPrisma().visitor.count();
    const beforeDevices = await getPrisma().visitorDevice.count();
    const beforeOutbox = await getPrisma().emailOutbox.count();
    const beforeAudit = await getPrisma().auditLog.count();

    const result = await registerVisitorRecord(
      {
        fullName: "Blocked Person",
        gamertag: "BlockedGamer",
        email: "blocked@ut.mx",
      },
      NOW,
    );

    expect(result).toEqual({ status: "blocked" });
    expect(await getPrisma().visitor.count()).toBe(beforeVisitors);
    expect(await getPrisma().visitorDevice.count()).toBe(beforeDevices);
    expect(await getPrisma().emailOutbox.count()).toBe(beforeOutbox);
    expect(await getPrisma().auditLog.count()).toBe(beforeAudit);
  });
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
