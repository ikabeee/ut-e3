/**
 * @jest-environment node
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type * as NextServer from "next/server";
import { isValidElement, Suspense } from "react";
import { AdminSidebar } from "@features/admin/components/admin-sidebar";
import { AdminLayout, SysadminSidebar } from "@features/admin/pages/admin-layout";
import { getPrisma } from "@shared/lib/server/prisma";
import { OTHER_ROLES, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// connection() needs the request scope of a real render; the session comes from the stubbed cookies instead.
jest.spyOn(jest.requireActual<typeof NextServer>("next/server"), "connection").mockResolvedValue(undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("SysadminSidebar", () => {
  it("draws the sidebar for the sysadmin (S10)", async () => {
    await signInAs("sysadmin");

    expect(await sidebarType()).toBe(AdminSidebar);
  });

  it("draws the sidebar for a stand administrator whose second role is the sysadmin (S1)", async () => {
    const id = await signInAs("stand_admin");

    await getPrisma().account.update({ where: { id: id ?? "" }, data: { secondaryRole: "sysadmin" } });

    expect(await sidebarType()).toBe(AdminSidebar);
  });

  it.each(OTHER_ROLES)("draws nothing for %s, who gets the page alone", async (role) => {
    await signInAs(role);

    await expect(SysadminSidebar()).resolves.toBeNull();
  });
});

describe("AdminLayout", () => {
  it("renders the page outside the boundary that waits for the session, so the page never waits for it", () => {
    const page = <main>Contenido</main>;
    const [boundary, content] = AdminLayout({ children: page }).props.children;

    expect(boundary.type).toBe(Suspense);
    expect(content).toBe(page);
  });

  it("is the only frame that draws the sidebar: no page of the panel draws it (S10)", () => {
    const pages = [
      ...readdirSync("src/features/admin/pages").map((file) => path.join("src/features/admin/pages", file)),
      "src/features/tournament/pages/kof-page.tsx",
      "src/features/raffle/pages/raffle-admin-page.tsx",
    ].filter((file) => !file.endsWith("admin-layout.tsx"));

    for (const file of pages) {
      expect([file, readFileSync(file, "utf8").includes("admin-sidebar")]).toEqual([file, false]);
    }
  });
});

async function sidebarType() {
  const sidebar = await SysadminSidebar();

  return isValidElement(sidebar) ? sidebar.type : null;
}
