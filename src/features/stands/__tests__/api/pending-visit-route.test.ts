/**
 * @jest-environment node
 */
import { GET as getPendingVisit } from "@features/stands/api/pending-visit-route";
import { requestVisit } from "@features/stands/lib/server/pending-visit-mutations";
import {
  createEventSettings,
  setClockToTheEvent,
  createStand,
  createStandAccount,
  createVisitor,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createVisitorDevice, setVisitorDeviceCookie } from "@shared/lib/server/visitor-device";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let standId = "";

let staffId = "";

let visitorId = "";

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
  visitorId = (await createVisitor("Jugador1", "12345")).id;
  standId = (await createStand(1, "Pixel Quest")).id;
  staffId = (await createStandAccount("staff@ut.mx", "stand_staff", standId)).id;

  const started = await requestVisit({ standId, scannedById: staffId, pin: "12345" }, new Date());

  pendingVisitId = started.status === "requested" ? started.pendingVisitId : "";
});

describe("pending visit route", () => {
  it("shows the visitor of the device the visit that waits for them", async () => {
    await signInAsVisitor();

    const response = await getPendingVisit();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      pending: { id: pendingVisitId, standCode: "ZA-S1", gameName: "Pixel Quest" },
    });
  });

  it("shows nothing to a device without a passport", async () => {
    expect(await (await getPendingVisit()).json()).toEqual({ pending: null });
  });
});

async function signInAsVisitor() {
  await setVisitorDeviceCookie(
    await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId)),
  );
}
