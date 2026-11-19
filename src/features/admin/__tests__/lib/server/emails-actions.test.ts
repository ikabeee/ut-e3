/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  rebuildEmailAction,
  resendFailedEmailsAction,
  resendOneEmailAction,
  sendNowAction,
  viewEmailTextAction,
} from "@features/admin/lib/emails-actions";
import {
  auditActions,
  createAbandoned,
  createEmail,
  createFailed,
  findEmail,
} from "@features/admin/__tests__/lib/server/emails-test-utils";
import { expectRefused, otherRoleCases, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { stubAfter } from "@shared/__tests__/lib/server/headers-stub";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const COPY = ADMIN_COPY.emails;

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let afterStub = stubAfter();

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  afterStub.restore();
  afterStub = stubAfter();
  delete process.env.SMTP_HOST;
  await getPrisma().emailOutbox.deleteMany();
});

// Only the sysadmin reaches the outbox tools; every other role is sent to the login and nothing is written.
it.each(
  otherRoleCases({
    resendOneEmailAction,
    resendFailedEmailsAction,
    rebuildEmailAction,
    viewEmailTextAction,
    sendNowAction,
  }),
)("%s calling %s is sent to the login and writes nothing", async (role, _name, action) => {
  await expectRefused(role, action);
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();

  for (const [name, value] of Object.entries(fields)) data.set(name, value);

  return data;
}

describe("resendOneEmailAction", () => {
  it("resends a failed email as the sysadmin and queues its delivery after the answer", async () => {
    const actorId = await signInAs("sysadmin");
    const failed = await createFailed();

    const state = await resendOneEmailAction(null, form({ emailId: failed.id }));

    expect(state).toEqual({ status: "done", message: COPY.resent });
    await expect(findEmail(failed.id)).resolves.toMatchObject({ attempts: 0 });
    await expect(auditActions(actorId ?? "")).resolves.toEqual(["admin.email.resend"]);
    expect(afterStub.callbacks).toHaveLength(1);
  });

  it("answers an error for a sent email and writes nothing", async () => {
    const actorId = await signInAs("sysadmin");
    const sent = await createEmail({ sentAt: new Date(), text: "" });

    await expect(resendOneEmailAction(null, form({ emailId: sent.id }))).resolves.toEqual({
      status: "error",
      message: COPY.resendRefused,
    });
    await expect(auditActions(actorId ?? "")).resolves.toEqual([]);
    expect(afterStub.callbacks).toHaveLength(0);
  });
});

describe("resendFailedEmailsAction", () => {
  it("resends all the failed emails when the confirmed count is still right", async () => {
    const actorId = await signInAs("sysadmin");
    const first = await createFailed();
    await createFailed();

    const state = await resendFailedEmailsAction(null, form({ expectedCount: "2" }));

    expect(state).toEqual({ status: "done", message: COPY.resendFailed.done(2) });
    await expect(findEmail(first.id)).resolves.toMatchObject({ attempts: 0 });
    await expect(auditActions(actorId ?? "")).resolves.toEqual(["admin.email.resend_failed"]);
  });

  it("refuses a stale count with the new one, and a count that is not a positive integer", async () => {
    const actorId = await signInAs("sysadmin");
    const failed = await createFailed();

    await expect(resendFailedEmailsAction(null, form({ expectedCount: "5" }))).resolves.toEqual({
      status: "error",
      message: COPY.resendFailed.changed(1),
    });

    for (const value of ["", "0", "-1", "1.5", "uno"]) {
      await expect(resendFailedEmailsAction(null, form({ expectedCount: value }))).resolves.toEqual({
        status: "error",
        message: COPY.invalid,
      });
    }

    await expect(findEmail(failed.id)).resolves.toMatchObject({ attempts: 5 });
    await expect(auditActions(actorId ?? "")).resolves.toEqual([]);
  });
});

describe("rebuildEmailAction", () => {
  it("explains why an email cannot be rebuilt and leaves it as it was", async () => {
    const actorId = await signInAs("sysadmin");
    const code = await createAbandoned({ kind: "login_code", referenceId: "a" });

    await expect(rebuildEmailAction(null, form({ emailId: code.id }))).resolves.toEqual({
      status: "error",
      message: COPY.rebuildRefused.notRebuildable,
    });
    await expect(findEmail(code.id)).resolves.toMatchObject({ attempts: 5, text: "" });
    await expect(auditActions(actorId ?? "")).resolves.toEqual([]);
  });
});

describe("viewEmailTextAction", () => {
  it("answers the text of an email with a body, and an error for an erased one", async () => {
    await signInAs("sysadmin");
    const withBody = await createFailed({ text: "Tu PIN es 12345" });
    const erased = await createAbandoned();

    await expect(viewEmailTextAction(null, form({ emailId: withBody.id }))).resolves.toEqual({
      status: "text",
      text: "Tu PIN es 12345",
    });
    await expect(viewEmailTextAction(null, form({ emailId: erased.id }))).resolves.toEqual({
      status: "error",
      message: COPY.viewRefused,
    });
  });
});

describe("sendNowAction", () => {
  it("says there is no SMTP when the server has none, and leaves every attempt untouched", async () => {
    const actorId = await signInAs("sysadmin");
    const pending = await createEmail();

    await expect(sendNowAction()).resolves.toEqual({ status: "error", message: COPY.sendNow.noSmtp });

    await expect(findEmail(pending.id)).resolves.toMatchObject({ attempts: 0, sentAt: null });
    await expect(auditActions(actorId ?? "")).resolves.toEqual([]);
  });
});
