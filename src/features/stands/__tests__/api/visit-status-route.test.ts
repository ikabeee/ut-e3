/**
 * @jest-environment node
 */
import { GET as getVisitStatus } from "@features/stands/api/visit-status-route";
import { requestVisit } from "@features/stands/lib/server/pending-visit-mutations";
import {
  createEventSettings,
  setClockToTheEvent,
  createStand,
  createStandAccount,
  createVisitor,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let standId = "";

let staffId = "";

let pendingVisitId = "";

beforeAll(async () => {
  setClockToTheEvent();
  await createEventSettings();
});

afterAll(async () => {
  jest.useRealTimers();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().pendingVisit.deleteMany();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().account.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().stand.deleteMany();
  await createVisitor("Jugador1", "12345");
  standId = (await createStand(1, "Pixel Quest")).id;
  staffId = (await createStandAccount("staff@ut.mx", "stand_staff", standId)).id;

  const started = await requestVisit({ standId, scannedById: staffId, pin: "12345" }, new Date());

  pendingVisitId = started.status === "requested" ? started.pendingVisitId : "";
});

describe("visit status route", () => {
  it("tells the stand how its visit is going", async () => {
    await createSession(staffId);

    const response = await getVisitStatus(request(pendingVisitId));

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "waiting" });
  });

  it("answers 401 without a stand session", async () => {
    expect((await getVisitStatus(request(pendingVisitId))).status).toBe(401);
  });

  it("answers 401 to an account that is not from a stand", async () => {
    const sysadmin = await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "hash" },
    });

    await createSession(sysadmin.id);

    expect((await getVisitStatus(request(pendingVisitId))).status).toBe(401);
  });

  it("treats a missing id as a visit that is gone", async () => {
    await createSession(staffId);

    expect(await (await getVisitStatus(new Request("http://localhost/api/stand/visit-status"))).json()).toEqual({
      status: "expired",
    });
  });
});

function request(id: string): Request {
  return new Request(`http://localhost/api/stand/visit-status?id=${id}`);
}
