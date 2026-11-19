import "server-only";
import { getEntryWindow, type EntrySchedule } from "@features/tournament/lib/entries-rules";
import { MAX_ENTRANTS, PRE_LIST_LIMIT } from "@features/tournament/lib/tournament-rules";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { EntryChannel, EntryStatus, EntryView, SelfEntryAvailability } from "@features/tournament/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

/**
 * What the passport offers a visitor who is not in the tournament. It only reads; `addSelfEntry` decides again when
 * the visitor presses the button, so a stale screen cannot enroll anyone out of the rules.
 */
export async function getSelfEntryAvailability(visitorId: string, now: Date): Promise<SelfEntryAvailability> {
  const visitor = await getPrisma().visitor.findUnique({ where: { id: visitorId }, select: { excludedAt: true } });

  if (visitor?.excludedAt) return "excluded";

  const window = getEntryWindow(await getEntrySchedule(), now);

  if (window === "notOpen") return "notOpen";

  if (window === "closed") return "ended";

  if (window === "onsite") return "closed";

  return (await isListFull()) ? "full" : "open";
}

async function isListFull(): Promise<boolean> {
  const [preCount, places] = await Promise.all([
    getPrisma().tournamentEntry.count({ where: { channel: "pre" } }),
    getPrisma().tournamentEntry.count({ where: { status: { not: "no_show" } } }),
  ]);

  return preCount >= PRE_LIST_LIMIT || places >= MAX_ENTRANTS;
}

export async function getEntrySchedule(
  client: Pick<Prisma.TransactionClient, "eventSettings"> = getPrisma(),
): Promise<EntrySchedule> {
  const settings = await client.eventSettings.findUnique({
    where: { id: 1 },
    select: {
      kofRegistrationOpensAt: true,
      kofCheckInStartsAt: true,
      kofCheckInEndsAt: true,
      kofOnsiteSignupStartsAt: true,
      kofOnsiteSignupEndsAt: true,
      kofBracketGeneratesAt: true,
    },
  });

  if (!settings) throw new Error(TOURNAMENT_COPY.errors.missingSettings);

  return {
    registrationOpensAt: settings.kofRegistrationOpensAt,
    checkInStartsAt: settings.kofCheckInStartsAt,
    checkInEndsAt: settings.kofCheckInEndsAt,
    onsiteStartsAt: settings.kofOnsiteSignupStartsAt,
    onsiteEndsAt: settings.kofOnsiteSignupEndsAt,
    bracketGeneratesAt: settings.kofBracketGeneratesAt,
  };
}

/** The entries in the order they were added. Not cached: the administrator works with the latest list. */
export async function getEntries(): Promise<EntryView[]> {
  const rows = await getPrisma().tournamentEntry.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      visitorId: true,
      channel: true,
      status: true,
      checkedInAt: true,
      visitor: { select: { gamertag: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    visitorId: row.visitorId,
    gamertag: row.visitor.gamertag,
    channel: toChannel(row.channel),
    status: toStatus(row.status),
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
  }));
}

/** The status of the entry of a visitor, or `null` when they are not in the tournament (RF-75). */
export async function getVisitorEntryStatus(visitorId: string): Promise<EntryStatus | null> {
  const entry = await getPrisma().tournamentEntry.findUnique({ where: { visitorId }, select: { status: true } });

  return entry ? toStatus(entry.status) : null;
}

// The CHECK constraints of the table keep these two columns inside their lists.
function toChannel(value: string): EntryChannel {
  return value === "onsite" ? "onsite" : "pre";
}

function toStatus(value: string): EntryStatus {
  if (value === "checked_in" || value === "no_show") return value;

  return "registered";
}
