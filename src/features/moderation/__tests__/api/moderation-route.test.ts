/**
 * @jest-environment node
 */
import { GET } from "@features/moderation/api/moderation-route";
import {
  createStands,
  createVisitor,
  visitStands,
} from "@features/moderation/__tests__/lib/server/moderation-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

const request = (standId: string) => new Request(`http://localhost/api/admin/moderation/stand-visits?stand=${standId}`);

describe("GET /api/admin/moderation/stand-visits", () => {
  it.each(["anonymous", "stand_admin", "kof_admin", "help_desk"])("answers 401 to %s", async (role) => {
    await signInAs(role);

    expect((await GET(request("x"))).status).toBe(401);
  });

  it("answers 400 to the sysadmin without a stand", async () => {
    await signInAs("sysadmin");

    expect((await GET(new Request("http://localhost/api/admin/moderation/stand-visits"))).status).toBe(400);
  });

  it("gives the sysadmin a CSV with the gamertags and no PIN", async () => {
    await signInAs("sysadmin");

    const [stand] = await createStands(1);
    const visitor = await createVisitor("CsvPlayer", "51515");

    await visitStands({ visitorId: visitor.id, standIds: [stand.id] });

    const response = await GET(request(stand.id));
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(body).toContain("CsvPlayer");
    expect(body).not.toContain("51515");
  });
});
