/**
 * @jest-environment node
 */
import {
  answerVisitAction,
  cancelVisitAction,
  requestVisitAction,
  submitVisitAction,
} from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import {
  createEventSettings,
  setClockToTheEvent,
  createStand,
  createStandAccount,
  createVisitor,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt } from "@shared/lib/server/rate-limit";
import { createSession } from "@shared/lib/server/session";
import { createVisitorDevice, setVisitorDeviceCookie } from "@shared/lib/server/visitor-device";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const ERRORS = STANDS_COPY.kiosk.errors;

const PIN = "12345";

const SURVEY = { pin: PIN, gameRating: "5", standRating: "4", artRating: "3" };

const RATINGS = { gameRating: "5", standRating: "4", artRating: "3" };

const accountIds: Record<string, string> = {};

let standId = "";

let visitorId = "";

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
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().pendingVisit.deleteMany();
  await getPrisma().vote.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().account.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().stand.deleteMany();
  visitorId = (await createVisitor("Jugador1", PIN)).id;
  standId = (await createStand(1)).id;
  accountIds.staff = (await createStandAccount("staff@ut.mx", "stand_staff", standId)).id;
  accountIds.admin = (await createStandAccount("admin@ut.mx", "stand_admin", standId)).id;
  accountIds.sysadmin = (
    await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "hash" },
    })
  ).id;
});

describe("requestVisitAction", () => {
  it("leaves the visit waiting for the visitor to rate it from the passport", async () => {
    await signInAs("staff");

    const state = await requestVisitAction(null, createForm({ pin: PIN }));
    const pending = await getPrisma().pendingVisit.findFirstOrThrow();

    expect(state).toEqual({ status: "waiting", pin: PIN, pendingVisitId: pending.id });
    expect(pending).toMatchObject({ visitorId, standId, requestedById: accountIds.staff });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });

  it("opens the kiosk to the administrator of the stand too", async () => {
    await signInAs("admin");

    expect(await requestVisitAction(null, createForm({ pin: PIN }))).toMatchObject({ status: "waiting" });
  });

  it.each([
    ["a PIN with less than 5 digits", { pin: "123" }, ERRORS.pinFormat],
    ["a PIN with letters", { pin: "12a45" }, ERRORS.pinFormat],
    ["no PIN", {}, ERRORS.pinFormat],
    ["a PIN that belongs to nobody", { pin: "99999" }, ERRORS.unknownPin],
  ])("answers %s without leaving anything waiting", async (_case, fields, message) => {
    await signInAs("staff");

    expect(await requestVisitAction(null, createForm(fields))).toEqual({ status: "error", message });
    expect(await getPrisma().pendingVisit.count()).toBe(0);
  });

  it("tells that the passport already visited the stand", async () => {
    await signInAs("staff");
    await submitVisitAction(null, createForm(SURVEY));

    expect(await requestVisitAction(null, createForm({ pin: PIN }))).toEqual({
      status: "error",
      message: ERRORS.alreadyVisited,
    });
  });

  it("stops after too many attempts, so the PINs cannot be guessed", async () => {
    await signInAs("staff");

    for (let attempt = 0; attempt < 100; attempt += 1) {
      await consumeAttempt(`kiosk:${accountIds.staff}`, { limit: 100, windowMs: 5 * 60 * 1000 });
    }

    expect(await requestVisitAction(null, createForm({ pin: PIN }))).toEqual({
      status: "error",
      message: ERRORS.tooManyAttempts,
    });
  });

  it("sends an account that is not from a stand to /login", async () => {
    await signInAs("sysadmin");

    await expect(requestVisitAction(null, createForm({ pin: PIN }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requestVisitAction(null, createForm({ pin: PIN }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });
});

describe("cancelVisitAction", () => {
  it("drops the visit the staff stopped waiting for", async () => {
    await signInAs("staff");
    await requestVisitAction(null, createForm({ pin: PIN }));
    const pending = await getPrisma().pendingVisit.findFirstOrThrow();

    await cancelVisitAction(pending.id);

    expect(await getPrisma().pendingVisit.count()).toBe(0);
  });

  it("does not touch the pending visit of another stand", async () => {
    await signInAs("staff");
    await requestVisitAction(null, createForm({ pin: PIN }));
    const pending = await getPrisma().pendingVisit.findFirstOrThrow();
    const other = await createStand(2);

    accountIds.other = (await createStandAccount("other@ut.mx", "stand_staff", other.id)).id;
    await signInAs("other");
    await cancelVisitAction(pending.id);

    expect(await getPrisma().pendingVisit.count()).toBe(1);
  });

  it("sends an account that is not from a stand to /login", async () => {
    await signInAs("sysadmin");

    await expect(cancelVisitAction("any")).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });
});

describe("submitVisitAction", () => {
  it("records the visit in the stand of the account and thanks the visitor", async () => {
    await signInAs("staff");

    expect(await submitVisitAction(null, createForm(SURVEY))).toEqual({
      status: "done",
      message: STANDS_COPY.kiosk.thanks.message,
    });
    expect(await getPrisma().checkIn.findFirstOrThrow({ include: { vote: true } })).toMatchObject({
      standId,
      scannedById: accountIds.staff,
      vote: { gameRating: 5, standRating: 4, artRating: 3 },
    });
  });

  it("closes the visit that was waiting for the same passport", async () => {
    await signInAs("staff");
    await requestVisitAction(null, createForm({ pin: PIN }));
    await submitVisitAction(null, createForm(SURVEY));

    expect(await getPrisma().pendingVisit.count()).toBe(0);
  });

  it.each([
    ["a rating missing", { pin: PIN, gameRating: "5", standRating: "4" }, ERRORS.ratingsRequired],
    ["a rating out of range", { ...SURVEY, artRating: "9" }, ERRORS.ratingsRequired],
    ["a malformed PIN", { ...SURVEY, pin: "12" }, ERRORS.pinFormat],
    ["a PIN that belongs to nobody", { ...SURVEY, pin: "99999" }, ERRORS.unknownPin],
  ])("records nothing with %s", async (_case, fields, message) => {
    await signInAs("staff");

    expect(await submitVisitAction(null, createForm(fields))).toEqual({ status: "error", message });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });

  it("refuses the second visit of the same passport", async () => {
    await signInAs("staff");
    await submitVisitAction(null, createForm(SURVEY));

    expect(await submitVisitAction(null, createForm(SURVEY))).toEqual({
      status: "error",
      message: ERRORS.alreadyVisited,
    });
    expect(await getPrisma().checkIn.count()).toBe(1);
  });

  it("refuses the visit while the stand has no game", async () => {
    await getPrisma().game.deleteMany();
    await signInAs("staff");

    expect(await submitVisitAction(null, createForm(SURVEY))).toEqual({
      status: "error",
      message: ERRORS.standWithoutGame,
    });
  });

  it("sends an account that is not from a stand to /login", async () => {
    await signInAs("sysadmin");

    await expect(submitVisitAction(null, createForm(SURVEY))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });
});

describe("answerVisitAction", () => {
  it("records the visit the staff started, with the staff account as who scanned it", async () => {
    await startVisit();
    await signInAsVisitor();

    expect(await answerVisitAction(null, createForm(RATINGS))).toEqual({
      status: "done",
      message: STANDS_COPY.passportSurvey.thanks,
    });
    expect(await getPrisma().checkIn.findFirstOrThrow({ include: { vote: true } })).toMatchObject({
      visitorId,
      standId,
      scannedById: accountIds.staff,
      vote: { gameRating: 5, standRating: 4, artRating: 3 },
    });
  });

  it("answers only once", async () => {
    await startVisit();
    await signInAsVisitor();
    await answerVisitAction(null, createForm(RATINGS));

    expect(await answerVisitAction(null, createForm(RATINGS))).toEqual({
      status: "error",
      message: ERRORS.noPending,
    });
    expect(await getPrisma().checkIn.count()).toBe(1);
  });

  it("has nothing to record when the staff did not start a visit", async () => {
    await signInAsVisitor();

    expect(await answerVisitAction(null, createForm(RATINGS))).toEqual({
      status: "error",
      message: ERRORS.noPending,
    });
  });

  it("asks for the three ratings", async () => {
    await startVisit();
    await signInAsVisitor();

    expect(await answerVisitAction(null, createForm({ gameRating: "5" }))).toEqual({
      status: "error",
      message: ERRORS.ratingsRequired,
    });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });

  it("refuses a device without a passport", async () => {
    await startVisit();
    stubCookies(createCookieJar());

    expect(await answerVisitAction(null, createForm(RATINGS))).toEqual({
      status: "error",
      message: ERRORS.missingDevice,
    });
  });

  it("stops after too many attempts", async () => {
    await startVisit();
    await signInAsVisitor();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await consumeAttempt(`survey:${visitorId}`, { limit: 20, windowMs: 5 * 60 * 1000 });
    }

    expect(await answerVisitAction(null, createForm(RATINGS))).toEqual({
      status: "error",
      message: ERRORS.tooManyAttempts,
    });
  });
});

async function startVisit() {
  await signInAs("staff");
  await requestVisitAction(null, createForm({ pin: PIN }));
}

async function signInAs(key: string) {
  stubCookies(createCookieJar());
  await createSession(accountIds[key]);
}

async function signInAsVisitor() {
  stubCookies(createCookieJar());
  await setVisitorDeviceCookie(
    await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId)),
  );
}

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}
