/**
 * @jest-environment node
 */
import { submitTournamentCommand } from "@features/tournament/lib/tournament-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { generateTournament } from "@features/tournament/lib/server/tournament-mutations";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";
import { createPlayers, getMatch } from "@features/tournament/__tests__/tournament-test-utils";
import { createEventSettings, GENERATES_AT } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ERRORS = TOURNAMENT_COPY.errors;

const accountIds: Record<string, string> = {};

beforeAll(async () => {
  await createEventSettings();
  await createAccount("admin", "kof_admin");
  await createAccount("desk1", "kof_staff", 1);
  await createAccount("desk2", "kof_staff", 2);
  await createAccount("nodesk", "kof_staff");
  await createAccount("sysadmin", "sysadmin");
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().kofTournament.deleteMany();
  await generateTournament(accountIds.admin, createPlayers(64), GENERATES_AT);
});

describe("submitTournamentCommand", () => {
  it("lets a staff member start a match of its own desk and records who did it", async () => {
    await signInAs("desk1");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" }));

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_tournament.command", actorId: accountIds.desk1 },
    });

    expect(state).toEqual({ status: "applied" });
    expect(getMatch(await readTournament(), 1).status).toBe("active");
    expect(entry.entityType).toBe("kof_tournament");
  });

  it("rejects a staff member that captures a match of the other desk (UT-TO-14)", async () => {
    await signInAs("desk2");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" }));

    expect(state).toEqual({ status: "error", message: ERRORS.forbidden });
    expect((await readTournament()).version).toBe(0);
  });

  it("lets the KOF administrator capture a match of any desk (UT-TO-15)", async () => {
    await signInAs("admin");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-31" }));

    expect(state).toEqual({ status: "applied" });
    expect(getMatch(await readTournament(), 31).status).toBe("active");
  });

  it("keeps freezing for the administrator even on the desk of the staff member", async () => {
    await signInAs("desk1");

    const state = await submitTournamentCommand(null, createForm({ type: "freeze_match", matchId: "match-1" }));

    expect(state).toEqual({ status: "error", message: ERRORS.forbidden });
    expect(getMatch(await readTournament(), 1).status).toBe("ready");
  });

  it("rejects a staff member that has no desk", async () => {
    await signInAs("nodesk");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" }));

    expect(state).toEqual({ status: "error", message: ERRORS.forbidden });
  });

  it("leaves a frozen match to the administrator (UT-TO-20, UT-TO-21)", async () => {
    await signInAs("admin");
    await submitTournamentCommand(null, createForm({ type: "freeze_match", matchId: "match-1" }));
    await signInAs("desk1");

    const blocked = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" }));

    expect(blocked).toEqual({ status: "error", message: ERRORS.wrongStatus(TOURNAMENT_COPY.status.frozen) });

    await signInAs("admin");

    const resolved = await submitTournamentCommand(
      null,
      createForm({ type: "disqualify", matchId: "match-1", slot: "0" }),
    );

    expect(resolved).toEqual({ status: "applied" });
    expect(getMatch(await readTournament(), 1)).toMatchObject({ status: "finished", outcome: "disqualified" });
  });

  it("answers the rule that a command breaks and leaves the tournament as it was", async () => {
    await signInAs("desk1");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-9" }));

    expect(state).toEqual({ status: "error", message: ERRORS.wrongStatus(TOURNAMENT_COPY.status.pending) });
    expect((await readTournament()).version).toBe(0);
  });

  it("answers invalid input without touching the tournament", async () => {
    await signInAs("admin");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match" }));

    expect(state).toEqual({ status: "error", message: ERRORS.invalidCommand });
    expect((await readTournament()).version).toBe(0);
  });

  it("answers an unknown match", async () => {
    await signInAs("admin");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-99" }));

    expect(state).toEqual({ status: "error", message: ERRORS.matchNotFound });
  });

  it("explains that the bracket does not exist yet", async () => {
    await getPrisma().kofTournament.deleteMany();
    await signInAs("admin");

    const state = await submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" }));

    expect(state).toEqual({ status: "error", message: ERRORS.notGenerated });
  });

  it.each(["sysadmin"])("sends a %s to /login without running the command", async (key) => {
    await signInAs(key);

    await expect(
      submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
    expect((await readTournament()).version).toBe(0);
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(
      submitTournamentCommand(null, createForm({ type: "start_match", matchId: "match-1" })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
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

async function readTournament() {
  const tournament = await getTournament();

  if (!tournament) throw new Error("Expected a stored tournament");

  return tournament;
}

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}
