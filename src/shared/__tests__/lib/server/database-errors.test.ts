/**
 * @jest-environment node
 */
import { isUniqueViolation, readDatabaseMessage } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().account.deleteMany();
});

describe("database errors", () => {
  it("recognises a repeated unique value", async () => {
    await createStaff("one@ut.mx", 1);

    const failure = await capture(() => createStaff("one@ut.mx", 2));

    expect(isUniqueViolation(failure)).toBe(true);
  });

  it("reads the message that a trigger raised, which Prisma reports as a foreign key error", async () => {
    await createStaff("one@ut.mx", 1);

    const failure = await capture(() => createStaff("two@ut.mx", 1));

    expect(isUniqueViolation(failure)).toBe(false);
    expect(readDatabaseMessage(failure)).toBe("La mesa ya tiene un staff");
  });

  it("reads the message of any other error and nothing from a value that is not an error", () => {
    expect(readDatabaseMessage(new Error("disk is full"))).toBe("disk is full");
    expect(readDatabaseMessage("text")).toBe("");
    expect(isUniqueViolation(new Error("disk is full"))).toBe(false);
  });
});

function createStaff(email: string, kofDesk: number) {
  return getPrisma().account.create({ data: { email, name: email, role: "kof_staff", status: "invited", kofDesk } });
}

async function capture<T>(operation: () => Promise<T>): Promise<Error> {
  try {
    await operation();
  } catch (cause) {
    return cause instanceof Error ? cause : new Error(String(cause));
  }

  throw new Error("Expected the database to refuse the operation");
}
