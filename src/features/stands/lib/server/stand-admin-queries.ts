import "server-only";
import { listStandAccounts } from "@features/accounts/lib/server/invitations";
import { formatAdminStandCode } from "@features/games/lib/stand-code";
import { toStandZone } from "@features/stands/lib/stand-zones";
import type { AdminStand } from "@features/stands/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

/** Every stand with its game and accounts, in the order of the floor plan (RF-38). */
export async function listAdminStands(): Promise<AdminStand[]> {
  const [rows, admins, staff] = await Promise.all([
    getPrisma().stand.findMany({
      orderBy: [{ zone: "asc" }, { number: "asc" }],
      select: { id: true, zone: true, number: true, studio: true, groupCode: true, game: { select: { name: true } } },
    }),
    listStandAccounts({ role: "stand_admin" }),
    listStandAccounts({ role: "stand_staff" }),
  ]);

  return rows.flatMap(({ game, zone: rawZone, ...row }) => {
    const zone = toStandZone(rawZone);

    if (!zone) return [];

    const stand = { ...row, zone };

    return [
      {
        ...stand,
        code: formatAdminStandCode(stand),
        gameName: game?.name ?? null,
        admins: admins.filter((admin) => admin.standId === row.id),
        activeStaff: staff.filter((member) => member.standId === row.id && member.status !== "disabled").length,
      },
    ];
  });
}
