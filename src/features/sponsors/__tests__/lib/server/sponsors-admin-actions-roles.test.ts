/**
 * @jest-environment node
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildPng } from "@features/sponsors/__tests__/lib/logo-fixture";
import { deleteSponsorAction, saveSponsorAction } from "@features/sponsors/lib/sponsors-admin-actions";
import {
  expectRefused,
  OTHER_ROLES,
  otherRoleCases,
  signInAs,
  sysadminForm,
} from "@shared/__tests__/lib/server/sysadmin-only";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// RF-41: only the sysadmin registers sponsors.
it.each(otherRoleCases({ saveSponsorAction, deleteSponsorAction }))(
  "%s calling %s is sent to the login and writes nothing",
  async (role, _name, action) => {
    await expectRefused(role, action);
  },
);

it.each(OTHER_ROLES)("%s uploading a logo is sent to the login and stores no file", async (role) => {
  const uploads = mkdtempSync(path.join(tmpdir(), "ut-e3-test-uploads-"));

  process.env.UPLOADS_DIR = uploads;
  await signInAs(role);

  const form = sysadminForm();

  form.set("logoFile", new File([Uint8Array.from(buildPng({ width: 10, height: 10 }))], "logo.png"));

  await expect(saveSponsorAction(null, form)).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  expect(existsSync(path.join(uploads, "sponsors"))).toBe(false);
  await expect(getPrisma().sponsor.count()).resolves.toBe(0);
  rmSync(uploads, { recursive: true, force: true });
});
