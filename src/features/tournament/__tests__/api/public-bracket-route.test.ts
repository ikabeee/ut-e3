/**
 * @jest-environment node
 */
import { GET } from "@features/tournament/api/public-bracket-route";
import { generateTournament } from "@features/tournament/lib/server/tournament-mutations";
import { createPlayers } from "@features/tournament/__tests__/tournament-test-utils";
import { createEventSettings, GENERATES_AT } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let adminId = "";

beforeAll(async () => {
  await createEventSettings();
  adminId = (
    await getPrisma().account.create({
      data: { email: "kof-admin@ut.mx", name: "KOF", role: "kof_admin", status: "active", password: "hash" },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().kofTournament.deleteMany();
  await getPrisma().eventSettings.update({ where: { id: 1 }, data: { publicBracketEnabled: true } });
});

describe("GET /api/tournament/public (S3)", () => {
  it("answers without a session and says the bracket is pending before it exists", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ state: "pending" });
    expect(body.serverNow).toEqual(expect.any(Number));
  });

  it("sends the public bracket, never cached and without ids", async () => {
    await generateTournament(adminId, createPlayers(64), GENERATES_AT);

    const response = await GET();
    const text = await response.text();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.parse(text)).toMatchObject({ state: "open", bracket: { version: 0 } });
    expect(text).toContain("Tag1");
    expect(text).not.toContain("player-");
  });

  it("sends only the state when the KOF administrator closed it", async () => {
    await generateTournament(adminId, createPlayers(64), GENERATES_AT);
    await getPrisma().eventSettings.update({ where: { id: 1 }, data: { publicBracketEnabled: false } });

    const text = await (await GET()).text();

    expect(JSON.parse(text)).toMatchObject({ state: "closed" });
    expect(text).not.toContain("Tag");
  });
});
