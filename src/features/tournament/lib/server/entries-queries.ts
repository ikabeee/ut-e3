import "server-only";
import type { EntrySchedule } from "@features/tournament/lib/entries-rules";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { EntryChannel, EntryStatus, EntryView } from "@features/tournament/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

export async function getEntrySchedule(): Promise<EntrySchedule> {
  const settings = await getPrisma().eventSettings.findUnique({
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
