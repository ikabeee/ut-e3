/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { addEntryAction, checkInEntryAction, generateBracketAction } from "@features/tournament/lib/entries-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";
import { createEventSettings, createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const OUTCOMES = TOURNAMENT_COPY.ui.entries.outcomes;

const ERRORS = TOURNAMENT_COPY.ui.entries.errors;

const HOUR = 60 * 60 * 1000;

const accountIds: Record<string, string> = {};

let visitors: Awaited<ReturnType<typeof createVisitors>> = [];

beforeAll(async () => {
  await createEventSettings();
  await openEveryWindowAround(Date.now());
  visitors = await createVisitors(45);
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
  await getPrisma().kofTournament.deleteMany();
  await getPrisma().tournamentEntry.deleteMany();
});

describe("addEntryAction", () => {
  it("adds the visitor to the list and refreshes the screen", async () => {
    await signInAs("admin");

    const state = await addEntryAction(null, createForm({ gamertag: "Jugador1" }));
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    expect(state).toEqual({ status: "done", message: OUTCOMES.addedPre });
    expect(entry).toMatchObject({ visitorId: visitors[0].id, channel: "pre", registeredById: accountIds.admin });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a gamertag that nobody has", { gamertag: "NoExiste" }, OUTCOMES.unknownGamertag],
    ["an empty gamertag", { gamertag: "   " }, ERRORS.gamertagRequired],
    ["no gamertag", {}, ERRORS.gamertagRequired],
  ])("answers %s without creating anything", async (_case, fields, message) => {
    await signInAs("admin");

    expect(await addEntryAction(null, createForm(fields))).toEqual({ status: "error", message });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("says the visitor is already in", async () => {
    await signInAs("admin");
    await addEntryAction(null, createForm({ gamertag: "Jugador1" }));

    expect(await addEntryAction(null, createForm({ gamertag: "Jugador1" }))).toEqual({
      status: "error",
      message: OUTCOMES.alreadyEntered,
    });
  });
});

describe("checkInEntryAction", () => {
  it("checks the player in with the PIN", async () => {
    await insertEntry(0, "registered");
    await signInAs("admin");

    const state = await checkInEntryAction(null, createForm({ pin: " 00001 " }));

    expect(state).toEqual({ status: "done", message: OUTCOMES.checkedIn("Jugador1") });
    expect((await getPrisma().tournamentEntry.findFirstOrThrow()).status).toBe("checked_in");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a PIN that nobody has", { pin: "99999" }, OUTCOMES.unknownPin],
    ["no PIN", {}, ERRORS.pinRequired],
  ])("answers %s", async (_case, fields, message) => {
    await insertEntry(0, "registered");
    await signInAs("admin");

    expect(await checkInEntryAction(null, createForm(fields))).toEqual({ status: "error", message });
    expect((await getPrisma().tournamentEntry.findFirstOrThrow()).status).toBe("registered");
  });
});

describe("generateBracketAction", () => {
  it("generates the bracket with the players that checked in, only once", async () => {
    await insertManyCheckedIn(40);
    await signInAs("admin");

    const first = await generateBracketAction();
    const second = await generateBracketAction();

    expect(first).toEqual({ status: "done", message: OUTCOMES.generated });
    expect((await getTournament())?.players).toHaveLength(40);
    expect(second).toEqual({ status: "error", message: OUTCOMES.alreadyGenerated });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("explains that it needs enough players and stores nothing", async () => {
    await insertManyCheckedIn(31);
    await signInAs("admin");

    expect(await generateBracketAction()).toEqual({
      status: "error",
      message: TOURNAMENT_COPY.errors.invalidEntrantCount(32, 64),
    });
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });

  it("says when the bracket cannot be generated yet", async () => {
    await insertManyCheckedIn(40);
    await getPrisma().eventSettings.update({
      where: { id: 1 },
      data: { kofBracketGeneratesAt: new Date(Date.now() + 2 * HOUR) },
    });
    await signInAs("admin");

    try {
      const state = await generateBracketAction();

      expect(state.status).toBe("error");
      expect(state.message).toContain("El bracket se genera a las");
    } finally {
      await getPrisma().eventSettings.update({
        where: { id: 1 },
        data: { kofBracketGeneratesAt: new Date(Date.now() - HOUR) },
      });
    }
  });
});

describe("who can use them (UT-TO-27)", () => {
  it("refuses a staff member in every action and changes nothing", async () => {
    await insertManyCheckedIn(40);
    await signInAs("desk1");

    const forbidden = { status: "error", message: ERRORS.forbidden };

    expect(await addEntryAction(null, createForm({ gamertag: "Jugador41" }))).toEqual(forbidden);
    expect(await checkInEntryAction(null, createForm({ pin: "00001" }))).toEqual(forbidden);
    expect(await generateBracketAction()).toEqual(forbidden);
    expect(await getPrisma().tournamentEntry.count()).toBe(40);
    expect(await getPrisma().kofTournament.count()).toBe(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("sends a sysadmin and a visitor without a session to /login", async () => {
    await signInAs("sysadmin");

    await expect(addEntryAction(null, createForm({ gamertag: "Jugador1" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });

    stubCookies(createCookieJar());

    await expect(generateBracketAction()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

// The actions use the real clock, so the hours of the event are placed around it: the list is open, the check-in is
// running, the on-site sign-up has not started and the bracket can already be generated.
async function openEveryWindowAround(now: number) {
  await getPrisma().eventSettings.update({
    where: { id: 1 },
    data: {
      kofRegistrationOpensAt: new Date(now - 48 * HOUR),
      kofCheckInStartsAt: new Date(now - HOUR),
      kofCheckInEndsAt: new Date(now + HOUR),
      kofOnsiteSignupStartsAt: new Date(now + 2 * HOUR),
      kofOnsiteSignupEndsAt: new Date(now + 3 * HOUR),
      kofBracketGeneratesAt: new Date(now - HOUR),
    },
  });
}

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

async function insertManyCheckedIn(count: number) {
  for (let index = 0; index < count; index += 1) {
    await insertEntry(index, "checked_in");
  }
}

async function insertEntry(index: number, status: "registered" | "checked_in") {
  await getPrisma().tournamentEntry.create({
    data: {
      visitorId: visitors[index].id,
      channel: "pre",
      status,
      checkedInAt: status === "checked_in" ? new Date() : null,
    },
  });
}

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}
