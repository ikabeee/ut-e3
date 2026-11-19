/**
 * @jest-environment node
 */
import { logServerEvent, redactSecrets } from "@shared/lib/server/server-log";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().serverLog.deleteMany();
});

describe("logServerEvent", () => {
  it("persists the level, the source, the message and the details", async () => {
    await logServerEvent("warn", "email", "Email failed, will retry", { emailId: "e-1", attempts: 2 });

    const rows = await getPrisma().serverLog.findMany();

    expect(rows).toEqual([
      expect.objectContaining({
        level: "warn",
        source: "email",
        message: "Email failed, will retry",
        details: { emailId: "e-1", attempts: 2 },
      }),
    ]);
  });

  it("stores empty details when none are given", async () => {
    await logServerEvent("info", "worker", "Started");

    await expect(getPrisma().serverLog.findFirstOrThrow()).resolves.toMatchObject({ details: {} });
  });

  it("redacts tokens, codes, passwords and addresses from the message and the details", async () => {
    await logServerEvent(
      "error",
      "request",
      "GET https://ut.mx/reset-password/abcdefghijklmnopqrstuvwxyz123456?x=1 failed",
      {
        password: "hunter2",
        nested: { sessionToken: "abc", note: "codigo 123456 para ana@ut.mx" },
        list: ["Bearer abc.def-ghi"],
      },
    );

    const row = await getPrisma().serverLog.findFirstOrThrow();
    const stored = JSON.stringify(row);

    expect(row.message).toBe("GET https://ut.mx/reset-password/[redacted]?[redacted] failed");
    expect(stored).not.toContain("hunter2");
    expect(stored).not.toContain("123456");
    expect(stored).not.toContain("ana@ut.mx");
    expect(stored).not.toContain("abc.def-ghi");
    expect(row.details).toEqual({
      password: "[redacted]",
      nested: { sessionToken: "[redacted]", note: "codigo [code] para a***@ut.mx" },
      list: ["Bearer [redacted]"],
    });
  });

  it("never throws when the database fails: it writes to the console instead", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const create = jest.spyOn(getPrisma().serverLog, "create").mockRejectedValue(new Error("SQLITE_FULL"));

    await expect(logServerEvent("error", "worker", "Job failed password=abc")).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(String(consoleError.mock.calls[0][0])).toContain("Job failed password=[redacted]");
    expect(String(consoleError.mock.calls[0][0])).toContain("SQLITE_FULL");

    create.mockRestore();
    consoleError.mockRestore();
  });
});

describe("redactSecrets", () => {
  it.each([
    ["https://ut.mx/login?token=abc&x=1", "https://ut.mx/login?[redacted]"],
    ["/invite/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA end", "/invite/[redacted] end"],
    ["Tu código es 482913.", "Tu código es [code]."],
    ["contraseña: Secreta123", "contraseña: [redacted]"],
    ["password=abc", "password=[redacted]"],
    ["para juan.perez@ut.mx", "para j***@ut.mx"],
    ["Tiene 12345 y 1234567", "Tiene 12345 y 1234567"],
  ])("%s", (input, expected) => {
    expect(redactSecrets(input)).toBe(expected);
  });
});
