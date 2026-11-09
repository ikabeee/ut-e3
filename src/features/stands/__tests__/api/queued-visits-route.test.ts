/**
 * @jest-environment node
 */
import { POST as postQueuedVisits } from "@features/stands/api/queued-visits-route";
import { queuedVisit } from "@features/stands/__tests__/lib/visit-queue-utils";
import {
  createEventSettings,
  createStand,
  createStandAccount,
  createVisitor,
  setClockToTheEvent,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const ID = "0f8c7a1e-3b2d-4c5e-8f9a-0b1c2d3e4f5a";

let ids = { standA: "", staffA: "", standB: "" };

beforeAll(async () => {
  setClockToTheEvent();
  await createEventSettings();
  await createVisitor("Jugador1", "12345");

  const standA = await createStand(1, "Pixel Quest");
  const standB = await createStand(2, "Otro juego");

  ids = {
    standA: standA.id,
    staffA: (await createStandAccount("staff-a@ut.mx", "stand_staff", standA.id)).id,
    standB: standB.id,
  };
});

afterAll(async () => {
  jest.useRealTimers();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().rateLimit.deleteMany();
});

describe("queued visits route", () => {
  it("records the batch at the stand of the session, whatever the body says (UT-CI-06)", async () => {
    await createSession(ids.staffA);

    const response = await postQueuedVisits(post({ visits: [{ ...queuedVisit(ID), standId: ids.standB }] }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ results: [{ id: ID, status: "ok" }] });
    expect(await getPrisma().checkIn.findUniqueOrThrow({ where: { id: ID } })).toMatchObject({
      standId: ids.standA,
      scannedById: ids.staffA,
    });
  });

  it("refuses a batch of 51 visits with 413 (UT-CI-15)", async () => {
    await createSession(ids.staffA);

    const visits = Array.from({ length: 51 }, () => queuedVisit(ID));

    expect((await postQueuedVisits(post({ visits }))).status).toBe(413);
  });

  it("answers 400 to a body that is not a batch", async () => {
    await createSession(ids.staffA);

    expect((await postQueuedVisits(post({ visitas: [] }))).status).toBe(400);
    expect((await postQueuedVisits(new Request("http://localhost/api", { method: "POST", body: "{" }))).status).toBe(
      400,
    );
  });

  it("answers 401 without a stand session", async () => {
    expect((await postQueuedVisits(post({ visits: [] }))).status).toBe(401);
  });

  it("answers 429 once the batches of an account pass the limit", async () => {
    await createSession(ids.staffA);

    for (let sent = 0; sent < 60; sent += 1) await postQueuedVisits(post({ visits: [] }));

    expect((await postQueuedVisits(post({ visits: [] }))).status).toBe(429);
  });
});

interface RouteBody {
  visits?: unknown[];
  visitas?: unknown[];
}

function post(body: RouteBody): Request {
  return new Request("http://localhost/api/stand/queued-visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
