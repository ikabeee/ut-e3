import "server-only";
import type { ScheduleItemInput } from "@features/schedule/lib/schedule-item-input";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

const ENTITY_TYPE = "schedule_item";

export async function createScheduleItem(actorId: string, item: ScheduleItemInput): Promise<void> {
  await getPrisma().$transaction(async (transaction) => {
    const { id } = await transaction.scheduleItem.create({ data: toRow(item), select: { id: true } });

    await recordAudit(transaction, {
      actorId,
      action: "schedule_item.create",
      entityType: ENTITY_TYPE,
      entityId: id,
      detail: { ...item },
    });
  });
}

// Returns false when the item no longer exists (another sysadmin tab deleted it), so the caller can say so.
export async function updateScheduleItem(actorId: string, id: string, item: ScheduleItemInput): Promise<boolean> {
  return getPrisma().$transaction(async (transaction) => {
    const { count } = await transaction.scheduleItem.updateMany({ where: { id }, data: toRow(item) });

    if (count === 0) return false;

    await recordAudit(transaction, {
      actorId,
      action: "schedule_item.update",
      entityType: ENTITY_TYPE,
      entityId: id,
      detail: { ...item },
    });

    return true;
  });
}

export async function removeScheduleItem(actorId: string, id: string): Promise<boolean> {
  return getPrisma().$transaction(async (transaction) => {
    const removed = await transaction.scheduleItem.findUnique({ where: { id } });

    if (!removed) return false;

    await transaction.scheduleItem.delete({ where: { id } });
    await recordAudit(transaction, {
      actorId,
      action: "schedule_item.delete",
      entityType: ENTITY_TYPE,
      entityId: id,
      detail: { ...removed, startsAt: removed.startsAt.toISOString(), endsAt: removed.endsAt.toISOString() },
    });

    return true;
  });
}

function toRow({ title, description, startsAt, endsAt, zone }: ScheduleItemInput) {
  return { title, description, startsAt: new Date(startsAt), endsAt: new Date(endsAt), zone };
}
