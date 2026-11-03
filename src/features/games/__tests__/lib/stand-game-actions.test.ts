/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { saveStandGameAction } from "@features/games/lib/stand-game-actions";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const COPY = GAMES_COPY.standGame;

const ids = { admin: "", otherAdmin: "", staff: "", sysadmin: "", stand: "", otherStand: "", genre: "" };

beforeAll(async () => {
  ids.stand = (await createStand(1)).id;
  ids.otherStand = (await createStand(2)).id;
  ids.admin = (await createAccount({ email: "admin@ut.mx", role: "stand_admin", standId: ids.stand })).id;
  ids.otherAdmin = (await createAccount({ email: "other@ut.mx", role: "stand_admin", standId: ids.otherStand })).id;
  ids.staff = (await createAccount({ email: "staff@ut.mx", role: "stand_staff", standId: ids.stand })).id;
  ids.sysadmin = (await createAccount({ email: "sysadmin@ut.mx", role: "sysadmin" })).id;
  ids.genre = (await getPrisma().genre.create({ data: { name: "Acción", slug: "accion" } })).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  refresh.mockClear();
  updateTag.mockClear();
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().gameImage.deleteMany();
  await getPrisma().game.deleteMany();
});

describe("saveStandGameAction (RF-31)", () => {
  it("registers the game of the stand of the session and refreshes the catalog", async () => {
    await signInAs(ids.admin);

    const state = await saveStandGameAction(null, form({ name: "Ruta 9" }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.created });
    expect(await getPrisma().game.findUniqueOrThrow({ where: { standId: ids.stand } })).toMatchObject({
      name: "Ruta 9",
    });
    expect(updateTag).toHaveBeenCalledWith("games");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("says the game was updated the second time", async () => {
    await signInAs(ids.admin);
    await saveStandGameAction(null, form({ name: "Ruta 9" }));

    expect(await saveStandGameAction(null, form({ name: "Ruta 10" }))).toEqual({
      status: "done",
      message: COPY.outcomes.updated,
    });
  });

  it("ignores a stand or a game that the form names: it is the stand of the session", async () => {
    await signInAs(ids.admin);
    await saveStandGameAction(null, form({ name: "Juego de otro" }, { standId: ids.otherStand }));
    await signInAs(ids.otherAdmin);
    await saveStandGameAction(null, form({ name: "Juego propio" }));

    const own = await getPrisma().game.findUniqueOrThrow({ where: { standId: ids.otherStand } });

    await signInAs(ids.admin);
    await saveStandGameAction(null, form({ name: "Intento" }, { gameId: own.id, standId: ids.otherStand }));

    expect((await getPrisma().game.findUniqueOrThrow({ where: { id: own.id } })).name).toBe("Juego propio");
    expect(await getPrisma().game.count({ where: { standId: ids.stand } })).toBe(1);
  });

  it("answers the message of the first field that is wrong and writes nothing", async () => {
    await signInAs(ids.admin);

    expect(await saveStandGameAction(null, form({ name: "" }))).toEqual({
      status: "error",
      message: COPY.errors.nameRequired,
    });
    expect(await saveStandGameAction(null, form({ genreId: "missing" }))).toEqual({
      status: "error",
      message: COPY.errors.genreInvalid,
    });
    expect(await getPrisma().game.count()).toBe(0);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("sends the staff of the stand back to its kiosk and writes nothing", async () => {
    await signInAs(ids.staff);

    await expect(saveStandGameAction(null, form({ name: "Ruta 9" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/stand/kiosk;"),
    });
    expect(await getPrisma().game.count()).toBe(0);
  });

  it("sends the other roles and visitors without a session to the login", async () => {
    await signInAs(ids.sysadmin);
    await expect(saveStandGameAction(null, form({ name: "Ruta 9" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });

    stubCookies(createCookieJar());
    await expect(saveStandGameAction(null, form({ name: "Ruta 9" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect(await getPrisma().game.count()).toBe(0);
  });

  it("does not work for a disabled administrator", async () => {
    await signInAs(ids.admin);
    await getPrisma().account.update({ where: { id: ids.admin }, data: { status: "disabled" } });

    await expect(saveStandGameAction(null, form({ name: "Ruta 9" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    await getPrisma().account.update({ where: { id: ids.admin }, data: { status: "active" } });
  });
});

async function signInAs(accountId: string) {
  stubCookies(createCookieJar());
  await createSession(accountId);
}

function form(overrides: Record<string, string>, extra: Record<string, string> = {}): FormData {
  const fields = { name: "Ruta 9", synopsis: "Una sinopsis.", genreId: ids.genre, itchUrl: "", ...overrides, ...extra };
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.append(name, value));

  return data;
}

async function createStand(number: number) {
  return getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } });
}

async function createAccount(account: { email: string; role: string; standId?: string }) {
  return getPrisma().account.create({
    data: { ...account, name: account.email, status: "active", password: "hash" },
  });
}
