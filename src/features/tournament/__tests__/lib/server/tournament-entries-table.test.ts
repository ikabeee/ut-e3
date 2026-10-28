/**
 * @jest-environment node
 */
import { createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const CHECKED_IN_AT = new Date("2026-11-20T17:20:00.000Z");

let visitorIds: string[] = [];

beforeAll(async () => {
  visitorIds = (await createVisitors(66)).map((visitor) => visitor.id);
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().tournamentEntry.deleteMany();
});

describe("tournament_entries table", () => {
  it("stores a pre-registration as registered, without a check-in time", async () => {
    const entry = await createEntry(0, { channel: "pre", status: "registered" });

    expect(entry).toMatchObject({ channel: "pre", status: "registered", checkedInAt: null });
  });

  it("allows only one entry for each visitor (UT-TO-03)", async () => {
    await createEntry(0, { channel: "pre", status: "registered" });

    await expect(createEntry(0, { channel: "pre", status: "registered" })).rejects.toThrow();
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
  });

  it("rejects a channel and a status outside the lists", async () => {
    await expect(createEntry(0, { channel: "web", status: "registered" })).rejects.toThrow();
    await expect(createEntry(1, { channel: "pre", status: "winner" })).rejects.toThrow();
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("asks for the check-in time if and only if the entry is checked in", async () => {
    await expect(createEntry(0, { channel: "pre", status: "checked_in" })).rejects.toThrow();
    await expect(
      createEntry(1, { channel: "pre", status: "registered", checkedInAt: CHECKED_IN_AT }),
    ).rejects.toThrow();
    await expect(createEntry(2, { channel: "pre", status: "no_show", checkedInAt: CHECKED_IN_AT })).rejects.toThrow();

    expect(await createEntry(3, { channel: "pre", status: "checked_in", checkedInAt: CHECKED_IN_AT })).toMatchObject({
      status: "checked_in",
    });
  });

  it("makes an on-site entry be born checked in", async () => {
    await expect(createEntry(0, { channel: "onsite", status: "registered" })).rejects.toThrow();
    await expect(createEntry(1, { channel: "onsite", status: "no_show" })).rejects.toThrow();

    expect(await createEntry(2, { channel: "onsite", status: "checked_in", checkedInAt: CHECKED_IN_AT })).toMatchObject(
      { channel: "onsite" },
    );
  });

  it("never changes an entry that did not show up again (UT-TO-34)", async () => {
    const entry = await createEntry(0, { channel: "pre", status: "registered" });

    await getPrisma().tournamentEntry.update({ where: { id: entry.id }, data: { status: "no_show" } });

    await expect(
      getPrisma().tournamentEntry.update({
        where: { id: entry.id },
        data: { status: "checked_in", checkedInAt: CHECKED_IN_AT },
      }),
    ).rejects.toThrow();
    await expect(
      getPrisma().tournamentEntry.update({ where: { id: entry.id }, data: { status: "registered" } }),
    ).rejects.toThrow();
    expect((await getPrisma().tournamentEntry.findUniqueOrThrow({ where: { id: entry.id } })).status).toBe("no_show");
  });

  it("limits the pre-registration list to 50 but still lets on-site entries in (UT-TO-28)", async () => {
    await fill(0, 50, "pre");

    await expect(createEntry(50, { channel: "pre", status: "registered" })).rejects.toThrow();
    expect(
      await createEntry(50, { channel: "onsite", status: "checked_in", checkedInAt: CHECKED_IN_AT }),
    ).toMatchObject({ channel: "onsite" });
  });

  it("limits the entries that did not miss the check-in to 64, and a no-show frees its place (UT-TO-02, UT-TO-40)", async () => {
    await fill(0, 50, "pre");
    await fill(50, 14, "onsite");

    await expect(
      createEntry(64, { channel: "onsite", status: "checked_in", checkedInAt: CHECKED_IN_AT }),
    ).rejects.toThrow();

    const first = await getPrisma().tournamentEntry.findFirstOrThrow({ where: { channel: "pre" } });

    await getPrisma().tournamentEntry.update({ where: { id: first.id }, data: { status: "no_show" } });

    expect(
      await createEntry(64, { channel: "onsite", status: "checked_in", checkedInAt: CHECKED_IN_AT }),
    ).toMatchObject({ channel: "onsite" });
    await expect(
      createEntry(65, { channel: "onsite", status: "checked_in", checkedInAt: CHECKED_IN_AT }),
    ).rejects.toThrow();
  });
});

async function fill(from: number, count: number, channel: "pre" | "onsite") {
  for (let index = from; index < from + count; index += 1) {
    await (channel === "pre"
      ? createEntry(index, { channel: "pre", status: "registered" })
      : createEntry(index, { channel: "onsite", status: "checked_in", checkedInAt: CHECKED_IN_AT }));
  }
}

interface EntryFields {
  channel: string;
  status: string;
  checkedInAt?: Date;
}

function createEntry(index: number, fields: EntryFields) {
  return getPrisma().tournamentEntry.create({ data: { visitorId: visitorIds[index], ...fields } });
}
