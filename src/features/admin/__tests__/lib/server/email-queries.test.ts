/**
 * @jest-environment node
 */
import { EMAIL_PAGE_SIZE, parseEmailFilters } from "@features/admin/lib/email-filters";
import { countResendableFailed, listEmails } from "@features/admin/lib/server/email-queries";
import {
  createAbandoned,
  createEmail,
  createFailed,
  NOW,
} from "@features/admin/__tests__/lib/server/emails-test-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
});

function list(params: Record<string, string>) {
  return listEmails(parseEmailFilters(params));
}

describe("listEmails", () => {
  it("shows the whole outbox, newest first, with the full address", async () => {
    const old = await createEmail({ to: "ana.perez@example.com", createdAt: new Date("2026-11-18T12:00:00Z") });
    const recent = await createEmail({ to: "beto@example.com", createdAt: new Date("2026-11-19T12:00:00Z") });

    const page = await list({});

    expect(page.rows.map((row) => row.id)).toEqual([recent.id, old.id]);
    expect(page.rows[1].to).toBe("ana.perez@example.com");
    expect(page).toMatchObject({ total: 2, page: 1, pageCount: 1 });
  });

  it("filters by status: sent, pending and failed", async () => {
    const sent = await createEmail({ sentAt: NOW, text: "" });
    const pending = await createEmail({ attempts: 2 });
    const failed = await createFailed();

    await expect(list({ status: "sent" }).then((page) => page.rows.map((row) => row.id))).resolves.toEqual([sent.id]);
    await expect(list({ status: "pending" }).then((page) => page.rows.map((row) => row.id))).resolves.toEqual([
      pending.id,
    ]);
    await expect(list({ status: "failed" }).then((page) => page.rows.map((row) => row.id))).resolves.toEqual([
      failed.id,
    ]);
  });

  it("filters by part of the recipient and of the subject", async () => {
    const ana = await createEmail({ to: "ana@example.com", subject: "Tu pasaporte" });
    await createEmail({ to: "beto@example.com", subject: "Código de acceso" });

    await expect(list({ recipient: "ANA@" }).then((page) => page.rows.map((row) => row.id))).resolves.toEqual([ana.id]);
    await expect(list({ subject: "pasaporte" }).then((page) => page.rows.map((row) => row.id))).resolves.toEqual([
      ana.id,
    ]);
    await expect(list({ recipient: "ana@", subject: "Código" })).resolves.toMatchObject({ total: 0, rows: [] });
  });

  it("filters by the day it was queued, in Cancun time, with the last day included", async () => {
    // 2026-11-19 23:30 in Cancun is already 2026-11-20 04:30 UTC.
    const lateNight = await createEmail({ createdAt: new Date("2026-11-20T04:30:00Z") });
    const nextMorning = await createEmail({ createdAt: new Date("2026-11-20T15:00:00Z") });
    const dayAfter = await createEmail({ createdAt: new Date("2026-11-21T06:00:00Z") });

    const ids = async (params: Record<string, string>) => (await list(params)).rows.map((row) => row.id);

    await expect(ids({ from: "2026-11-20", to: "2026-11-20" })).resolves.toEqual([nextMorning.id]);
    await expect(ids({ to: "2026-11-19" })).resolves.toEqual([lateNight.id]);
    await expect(ids({ from: "2026-11-20" })).resolves.toEqual([dayAfter.id, nextMorning.id]);
  });

  it("pages by 25 and clamps a page past the end to the last one", async () => {
    await getPrisma().emailOutbox.createMany({
      data: Array.from({ length: EMAIL_PAGE_SIZE + 5 }, (_, index) => ({
        to: `p${index}@example.com`,
        subject: "Asunto",
        text: "Hola",
        createdAt: new Date(NOW.getTime() + index * 1000),
      })),
    });

    const first = await list({});
    const last = await list({ page: "9" });

    expect(first).toMatchObject({ total: 30, page: 1, pageCount: 2 });
    expect(first.rows).toHaveLength(EMAIL_PAGE_SIZE);
    expect(last).toMatchObject({ page: 2 });
    expect(last.rows).toHaveLength(5);
  });

  it("tells what each row can do: resend with a body, rebuild only an erased abandoned one of a known kind", async () => {
    const withBody = await createFailed({ kind: "visitor_passport", referenceId: "v" });
    const rebuildable = await createAbandoned({ kind: "recovery_link", referenceId: "v" });
    const loginCode = await createAbandoned({ kind: "login_code", referenceId: "a" });
    const noKind = await createAbandoned();
    const sent = await createEmail({ sentAt: NOW, text: "", kind: "visitor_passport", referenceId: "v" });

    const rows = new Map((await list({})).rows.map((row) => [row.id, row]));

    expect(rows.get(withBody.id)).toMatchObject({
      status: "failed",
      hasBody: true,
      canResend: true,
      canRebuild: false,
    });
    expect(rows.get(rebuildable.id)).toMatchObject({
      hasBody: false,
      canResend: false,
      canRebuild: true,
      kind: "recovery_link",
    });
    expect(rows.get(loginCode.id)).toMatchObject({ canResend: false, canRebuild: false, kind: "login_code" });
    expect(rows.get(noKind.id)).toMatchObject({ canResend: false, canRebuild: false, kind: null });
    expect(rows.get(sent.id)).toMatchObject({ status: "sent", canResend: false, canRebuild: false });
  });
});

describe("countResendableFailed", () => {
  it("counts the failed emails that still have a body", async () => {
    await createFailed();
    await createFailed();
    await createAbandoned();
    await createEmail({ attempts: 1 });

    await expect(countResendableFailed()).resolves.toBe(2);
  });
});
