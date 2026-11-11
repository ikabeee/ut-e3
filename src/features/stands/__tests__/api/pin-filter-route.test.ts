/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { GET as getPinFilterResponse } from "@features/stands/api/pin-filter-route";
import { isPinFilter, mayBeRegisteredPin, PIN_FILTER_SPACE_FACTOR } from "@features/stands/lib/pin-filter";
import {
  createEventSettings,
  createStand,
  createStandAccount,
  createVisitor,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// cacheLife and cacheTag only run inside Next; the spies replace them on the module object the query reads.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

const cacheTag = jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const PINS = ["12345", "67890", "24680"];

let staffId = "";

beforeAll(async () => {
  await createEventSettings();

  for (const [index, pin] of PINS.entries()) await createVisitor(`Jugador${index}`, pin);

  const stand = await createStand(1, "Pixel Quest");

  staffId = (await createStandAccount("staff@ut.mx", "stand_staff", stand.id)).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(() => {
  stubCookies(createCookieJar());
});

describe("pin filter route", () => {
  it("gives a stand session a filter every registered PIN passes, tagged for the registration (UT-CI-33)", async () => {
    await createSession(staffId);

    const response = await getPinFilterResponse();
    const filter: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(isPinFilter(filter)).toBe(true);

    if (!isPinFilter(filter)) return;

    expect(filter.salt).toBe("ut-e3-pixel-and-code-2026");
    expect(filter.modulus).toBe(PINS.length * PIN_FILTER_SPACE_FACTOR);
    expect(await Promise.all(PINS.map((pin) => mayBeRegisteredPin(pin, filter)))).toEqual([true, true, true]);
    expect(cacheTag).toHaveBeenCalledWith("visitor-pins");
  });

  it("carries no PIN in clear nor a full PBKDF2 digest, only the reduced values (UT-CI-31)", async () => {
    await createSession(staffId);

    const body = await (await getPinFilterResponse()).text();

    PINS.forEach((pin) => expect(body).not.toContain(pin));
    expect(Object.keys(JSON.parse(body))).toEqual(["salt", "iterations", "modulus", "values"]);
    expect(body).not.toMatch(/[0-9a-f]{32}/);
  });

  it("answers 401 without a stand session (UT-CI-32)", async () => {
    expect((await getPinFilterResponse()).status).toBe(401);
  });

  it("answers 401 to an account that is not from a stand (UT-CI-32)", async () => {
    const sysadmin = await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "hash" },
    });

    await createSession(sysadmin.id);

    expect((await getPinFilterResponse()).status).toBe(401);
  });
});
