/**
 * @jest-environment node
 */
import { readDatabaseMessage } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { createRaffleAdmin, createVisitorWithTickets } from "@features/raffle/__tests__/lib/server/raffle-server-utils";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let adminId = "";

let ticketNumbers: number[] = [];

beforeAll(async () => {
  adminId = (await createRaffleAdmin()).id;

  for (const gamertag of ["Neo", "Trinity", "Morpheus", "Niobe"]) {
    await createVisitorWithTickets(gamertag);
  }

  ticketNumbers = (await getPrisma().raffleTicket.findMany({ orderBy: { number: "asc" } })).map((row) => row.number);
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

function createDraw(ticketNumber: number, data: { outcome?: string; decidedAt?: Date } = {}) {
  return getPrisma().raffleDraw.create({
    data: { ticketNumber, requestId: crypto.randomUUID(), drawnById: adminId, ...data },
  });
}

async function failureOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (cause) {
    return readDatabaseMessage(cause);
  }

  return "";
}

describe("raffle_tickets and raffle_draws tables", () => {
  it("accepts the drawn status of a ticket and refuses an unknown one", async () => {
    const [ticket] = ticketNumbers;

    await getPrisma().raffleTicket.update({ where: { number: ticket }, data: { status: "drawn" } });

    expect(
      await failureOf(getPrisma().raffleTicket.update({ where: { number: ticket }, data: { status: "won" } })),
    ).toMatch(/CHECK/i);

    await getPrisma().raffleTicket.update({ where: { number: ticket }, data: { status: "active" } });
  });

  it("UT-RA-03: allows a single pending draw (partial unique index)", async () => {
    const pending = await createDraw(ticketNumbers[0]);

    expect(await failureOf(createDraw(ticketNumbers[1]))).toMatch(/UNIQUE/i);

    await getPrisma().raffleDraw.update({
      where: { id: pending.id },
      data: { outcome: "discarded", decidedAt: new Date() },
    });
  });

  it("UT-RA-08: refuses a prize on a discarded draw", async () => {
    const discarded = await getPrisma().raffleDraw.findFirstOrThrow({ where: { outcome: "discarded" } });

    expect(
      await failureOf(
        getPrisma().raffleDraw.update({ where: { id: discarded.id }, data: { prizeName: "Taza", prizeById: adminId } }),
      ),
    ).toMatch(/CHECK/i);
  });

  it("refuses a decision without its hour, and a ticket that comes out twice", async () => {
    expect(await failureOf(createDraw(ticketNumbers[1], { outcome: "winner" }))).toMatch(/CHECK/i);
    expect(await failureOf(createDraw(ticketNumbers[0]))).toMatch(/UNIQUE/i);
  });

  it("keeps the decision, the prize and the draw itself once written (triggers)", async () => {
    const winner = await createDraw(ticketNumbers[2], { outcome: "winner", decidedAt: new Date() });

    expect(
      await failureOf(getPrisma().raffleDraw.update({ where: { id: winner.id }, data: { outcome: "discarded" } })),
    ).toContain("raffle_draws_final_outcome");
    expect(
      await failureOf(
        getPrisma().raffleDraw.update({ where: { id: winner.id }, data: { ticketNumber: ticketNumbers[3] } }),
      ),
    ).toContain("raffle_draws_fixed_draw");

    await getPrisma().raffleDraw.update({ where: { id: winner.id }, data: { prizeName: "Taza", prizeById: adminId } });

    expect(
      await failureOf(getPrisma().raffleDraw.update({ where: { id: winner.id }, data: { prizeName: "Teclado" } })),
    ).toContain("raffle_draws_final_prize");
    expect(await failureOf(getPrisma().raffleDraw.delete({ where: { id: winner.id } }))).toContain(
      "raffle_draws_no_delete",
    );
  });

  it("refuses an empty prize or one without who registered it", async () => {
    const winner = await createDraw(ticketNumbers[3], { outcome: "winner", decidedAt: new Date() });

    expect(
      await failureOf(
        getPrisma().raffleDraw.update({ where: { id: winner.id }, data: { prizeName: "  ", prizeById: adminId } }),
      ),
    ).toMatch(/CHECK/i);
    expect(
      await failureOf(getPrisma().raffleDraw.update({ where: { id: winner.id }, data: { prizeName: "Taza" } })),
    ).toMatch(/CHECK/i);
  });
});
