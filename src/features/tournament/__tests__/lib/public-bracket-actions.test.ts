/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { setPublicBracketAction } from "@features/tournament/lib/public-bracket-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { getPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-queries";
import { createEventSettings } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const COPY = TOURNAMENT_COPY.ui.publicBracket.admin;

const accountIds: Record<string, string> = {};

beforeAll(async () => {
  await createEventSettings();
  await createAccount("admin", "kof_admin");
  await createAccount("desk1", "kof_staff", 1);
  await createAccount("sysadmin", "sysadmin");
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  refresh.mockClear();
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().eventSettings.update({ where: { id: 1 }, data: { publicBracketEnabled: true } });
});

describe("setPublicBracketAction (S5)", () => {
  it("closes the public bracket for the KOF administrator and refreshes the screen", async () => {
    await signInAs("admin");

    expect(await setPublicBracketAction(null, createForm({ enabled: "false" }))).toEqual({
      status: "done",
      message: COPY.closed,
    });
    expect(await getPublicBracketEnabled()).toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reopens it", async () => {
    await signInAs("admin");
    await setPublicBracketAction(null, createForm({ enabled: "false" }));

    expect(await setPublicBracketAction(null, createForm({ enabled: "true" }))).toEqual({
      status: "done",
      message: COPY.opened,
    });
    expect(await getPublicBracketEnabled()).toBe(true);
  });

  it.each([
    { label: "a value that is not true or false", fields: { enabled: "maybe" } },
    { label: "no value", fields: {} },
  ])("answers $label and changes nothing", async ({ fields }) => {
    await signInAs("admin");

    expect(await setPublicBracketAction(null, createForm(fields))).toEqual({ status: "error", message: COPY.invalid });
    expect(await getPublicBracketEnabled()).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refuses the staff of a desk, who keep operating the tournament", async () => {
    await signInAs("desk1");

    expect(await setPublicBracketAction(null, createForm({ enabled: "false" }))).toEqual({
      status: "error",
      message: COPY.forbidden,
    });
    expect(await getPublicBracketEnabled()).toBe(true);
  });

  it("sends a sysadmin and a visitor without a session to /login", async () => {
    await signInAs("sysadmin");

    await expect(setPublicBracketAction(null, createForm({ enabled: "false" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });

    stubCookies(createCookieJar());

    await expect(setPublicBracketAction(null, createForm({ enabled: "false" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect(await getPublicBracketEnabled()).toBe(true);
  });
});

async function createAccount(key: string, role: string, kofDesk?: number) {
  const account = await getPrisma().account.create({
    data: { email: `${key}@ut.mx`, name: key, role, status: "active", password: "scrypt$1$1$1$a$b", kofDesk },
  });

  accountIds[key] = account.id;
}

async function signInAs(key: string) {
  stubCookies(createCookieJar());
  await createSession(accountIds[key]);
}

function createForm(fields: Record<string, string | undefined>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => {
    if (value !== undefined) form.append(name, value);
  });

  return form;
}
