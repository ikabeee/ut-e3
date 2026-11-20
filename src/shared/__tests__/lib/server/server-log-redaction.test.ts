/**
 * @jest-environment node
 */
import { deliverEmail, enqueueEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { logServerEvent, redactSecrets } from "@shared/lib/server/server-log";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

// enqueueEmail schedules the row at the real clock, so delivery must run after it, never at a fixed date.
const NOW = new Date(Date.now() + 60 * 60 * 1000);

const TOKEN = "Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MGFiY2RlZg";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().serverLog.deleteMany();
});

describe("redactSecrets with real payloads", () => {
  it.each([
    ["Authorization: Bearer abc.def-ghi", "Authorization: [redacted]"],
    ["authorization=Bearer abc.def", "authorization=[redacted]"],
    ["sent with Bearer abc.def-ghi to the API", "sent with Bearer [redacted] to the API"],
    ["Contraseña: Secreta123", "Contraseña: [redacted]"],
    ["CONTRASEÑA = Secreta123", "CONTRASEÑA = [redacted]"],
    [`GET /reset-password/${TOKEN}`, "GET /reset-password/[redacted]"],
    [`https://ut.mx/activate/${TOKEN}?token=${TOKEN}&next=/admin`, "https://ut.mx/activate/[redacted]?[redacted]"],
    [`/login?code=482913&token=${TOKEN}`, "/login?code=[code]&token=[redacted]"],
    ['{"password":"hunter2","token":"abc"}', '{"password":"[redacted]","token":"[redacted]"}'],
  ])("%s", (input, expected) => {
    expect(redactSecrets(input)).toBe(expected);
  });

  it("masks the addresses a Prisma error echoes", () => {
    const prismaError =
      'Invalid `prisma.account.create()` invocation: Unique constraint failed on the fields: (`email`) with value "ana.perez@ut.mx"';

    expect(redactSecrets(prismaError)).not.toContain("ana.perez@ut.mx");
    expect(redactSecrets(prismaError)).toContain("a***@ut.mx");
  });
});

describe("a failing delivery that echoes the email", () => {
  it("never stores the code, the address, the token or the password the mail server repeated", async () => {
    const body = `Tu código es 482913. Entra en https://ut.mx/activate/${TOKEN}?token=${TOKEN} contraseña: Secreta123`;
    const echo = Object.assign(new Error(`550 5.1.1 ana.perez@ut.mx rejected: ${body}`), { responseCode: 550 });

    const id = await getPrisma().$transaction((tx) =>
      enqueueEmail(tx, { to: "ana.perez@ut.mx", subject: "Tu código para entrar al panel del evento", text: body }),
    );

    await deliverEmail(
      id,
      async () => {
        throw echo;
      },
      NOW,
    );

    const stored = JSON.stringify(await getPrisma().serverLog.findMany());

    for (const secret of ["482913", "ana.perez@ut.mx", TOKEN, "Secreta123"]) expect(stored).not.toContain(secret);

    expect(stored).toContain("a***@ut.mx");
  });
});

describe("logServerEvent with real payloads", () => {
  it("redacts a login-code email, JSON keys, Bearer and Prisma errors in the message and the details", async () => {
    await logServerEvent("error", "worker", "Tu código es 482913, entra con Authorization: Bearer abc.def", {
      body: `Contraseña: Secreta123 en /reset-password/${TOKEN}?token=${TOKEN}`,
      password: "hunter2",
      nested: { apiKey: "k-1", note: "falló para ana.perez@ut.mx" },
    });

    const stored = JSON.stringify(await getPrisma().serverLog.findFirstOrThrow());

    for (const secret of ["482913", "abc.def", "Secreta123", TOKEN, "hunter2", "k-1", "ana.perez@ut.mx"])
      expect(stored).not.toContain(secret);
  });
});
