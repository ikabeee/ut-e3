/**
 * @jest-environment node
 */
import { INITIAL_SCHEDULE_ITEMS, seedScheduleItems } from "@features/schedule/lib/server/schedule-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

const PUBLIC_PROGRAM = [
  ["2026-11-20T17:00:00.000Z", "2026-11-20T17:30:00.000Z", "Inauguración en el escenario principal"],
  [
    "2026-11-20T17:00:00.000Z",
    "2026-11-20T17:45:00.000Z",
    "Check-in de la lista previa e inscripción presencial a KOF",
  ],
  [
    "2026-11-20T17:00:00.000Z",
    "2026-11-20T21:50:00.000Z",
    "Exhibición en los stands de los bloques A a D y en la zona de terror",
  ],
  ["2026-11-20T17:45:00.000Z", "2026-11-20T17:55:00.000Z", "Confirmación de participantes de KOF"],
  ["2026-11-20T17:55:00.000Z", "2026-11-20T17:55:00.000Z", "Publicación del bracket de KOF"],
  ["2026-11-20T18:00:00.000Z", "2026-11-20T19:00:00.000Z", "KOF: ronda de 64"],
  ["2026-11-20T18:30:00.000Z", "2026-11-20T20:30:00.000Z", "Mario Kart abierto"],
  ["2026-11-20T19:00:00.000Z", "2026-11-20T19:30:00.000Z", "KOF: ronda de 32"],
  ["2026-11-20T19:30:00.000Z", "2026-11-20T20:00:00.000Z", "KOF: octavos de final"],
  ["2026-11-20T20:00:00.000Z", "2026-11-20T20:30:00.000Z", "KOF: cuartos de final"],
  ["2026-11-20T20:30:00.000Z", "2026-11-20T21:00:00.000Z", "Actividad en el escenario 1"],
  ["2026-11-20T21:00:00.000Z", "2026-11-20T21:10:00.000Z", "KOF: semifinales"],
  ["2026-11-20T21:00:00.000Z", "2026-11-20T21:50:00.000Z", "Mario Kart abierto"],
  ["2026-11-20T21:10:00.000Z", "2026-11-20T21:40:00.000Z", "Actividad en el escenario 2"],
  ["2026-11-20T21:40:00.000Z", "2026-11-20T21:50:00.000Z", "KOF: partido por el tercer lugar, en el escenario"],
  ["2026-11-20T21:50:00.000Z", "2026-11-20T21:50:00.000Z", "Cierran los stands, Mario Kart y la zona de terror"],
  ["2026-11-20T21:55:00.000Z", "2026-11-20T22:05:00.000Z", "Presentación de los finalistas de KOF"],
  ["2026-11-20T22:05:00.000Z", "2026-11-20T22:15:00.000Z", "Gran final de KOF"],
  ["2026-11-20T22:30:00.000Z", "2026-11-20T23:00:00.000Z", "Presentación de ganadores"],
  ["2026-11-20T23:00:00.000Z", "2026-11-20T23:30:00.000Z", "Rifa final de premios"],
  ["2026-11-20T23:30:00.000Z", "2026-11-21T00:00:00.000Z", "Agradecimientos y cierre"],
];

describe("INITIAL_SCHEDULE_ITEMS", () => {
  it("follows the public program of the run sheet, row by row", () => {
    const program = INITIAL_SCHEDULE_ITEMS.map((item) => [item.startsAt, item.endsAt, item.title]);

    expect(program).toEqual(PUBLIC_PROGRAM);
  });

  it("gives every item a description and a unique id", () => {
    const ids = INITIAL_SCHEDULE_ITEMS.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    INITIAL_SCHEDULE_ITEMS.forEach((item) => expect(item.description).not.toBe(""));
  });

  it("points the KOF rounds to the KOF arena and the final to the main stage", () => {
    expect(INITIAL_SCHEDULE_ITEMS.find((item) => item.title === "KOF: ronda de 64")?.zone).toBe("kof");
    expect(INITIAL_SCHEDULE_ITEMS.find((item) => item.title === "Gran final de KOF")?.zone).toBe("stage");
  });

  it("does not name the old building", () => {
    INITIAL_SCHEDULE_ITEMS.forEach((item) => expect(item.description).not.toMatch(/E3/));
  });
});

describe("seedScheduleItems", () => {
  beforeEach(async () => {
    await getPrisma().scheduleItem.deleteMany();
  });

  it("writes every activity of the public program", async () => {
    await seedScheduleItems(getPrisma());

    expect((await readProgram()).toSorted()).toEqual(PUBLIC_PROGRAM.toSorted());
  });

  it("leaves the same rows when it runs twice", async () => {
    await seedScheduleItems(getPrisma());
    const firstRun = await readRows();

    await seedScheduleItems(getPrisma());

    expect(await readRows()).toEqual(firstRun);
  });

  it("keeps an activity title edited after the first run and adds no duplicate", async () => {
    await seedScheduleItems(getPrisma());
    await getPrisma().scheduleItem.updateMany({
      where: { title: "Gran final de KOF" },
      data: { title: "Gran final de KOF en vivo" },
    });

    await seedScheduleItems(getPrisma());

    expect(await getPrisma().scheduleItem.count()).toBe(PUBLIC_PROGRAM.length);
    expect(await getPrisma().scheduleItem.count({ where: { title: "Gran final de KOF en vivo" } })).toBe(1);
    expect(await getPrisma().scheduleItem.count({ where: { title: "Gran final de KOF" } })).toBe(0);
  });
});

async function readProgram(): Promise<string[][]> {
  const items = await getPrisma().scheduleItem.findMany();

  return items.map((item) => [item.startsAt.toISOString(), item.endsAt.toISOString(), item.title]);
}

function readRows() {
  return getPrisma().scheduleItem.findMany({ orderBy: { id: "asc" } });
}
