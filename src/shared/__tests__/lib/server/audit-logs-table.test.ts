/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

describe("audit_logs table", () => {
  it("keeps every inserted row and rejects updates and deletes", async () => {
    const entry = await prisma.auditLog.create({
      data: {
        action: "schedule_item.update",
        entityType: "schedule_item",
        entityId: "item-1",
        detail: { title: "Gran final de KOF" },
      },
    });

    await expect(
      prisma.auditLog.update({ where: { id: entry.id }, data: { action: "schedule_item.delete" } }),
    ).rejects.toThrow();
    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow();

    expect(await prisma.auditLog.findMany()).toEqual([
      expect.objectContaining({ id: entry.id, action: "schedule_item.update", detail: { title: "Gran final de KOF" } }),
    ]);
  });
});
