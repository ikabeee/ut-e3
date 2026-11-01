import type { SlotIndex, TournamentCommand } from "@features/tournament/lib/types";
import { readFormText } from "@shared/lib/form-data";

export type ParsedTournamentCommand = { isValid: true; command: TournamentCommand } | { isValid: false };

const INVALID: ParsedTournamentCommand = { isValid: false };

/** Reads the form of a Server Action: `type`, `matchId` and, when the command names players, one `slot` per player. */
export function parseTournamentCommand(form: FormData): ParsedTournamentCommand {
  const type = readFormText(form, "type");
  const matchId = readFormText(form, "matchId").trim();
  const slots = readSlots(form);

  if (!matchId || !slots) return INVALID;

  switch (type) {
    case "start_match":
    case "freeze_match":
    case "unfreeze_match":
    case "revert_result":
      return { isValid: true, command: { type, matchId } };
    case "finish_match":
      return slots.length === 1 ? { isValid: true, command: { type, matchId, loserSlot: slots[0] } } : INVALID;
    case "mark_no_show":
    case "disqualify":
      return isOneOrTwoDifferent(slots) ? { isValid: true, command: { type, matchId, slots } } : INVALID;
    default:
      return INVALID;
  }
}

function readSlots(form: FormData): SlotIndex[] | null {
  const slots: SlotIndex[] = [];

  for (const value of form.getAll("slot")) {
    const slot = toSlotIndex(value);

    if (slot === null) return null;

    slots.push(slot);
  }

  return slots;
}

function toSlotIndex(value: FormDataEntryValue): SlotIndex | null {
  if (value === "0") return 0;

  return value === "1" ? 1 : null;
}

function isOneOrTwoDifferent(slots: readonly SlotIndex[]): boolean {
  return slots.length >= 1 && slots.length <= 2 && new Set(slots).size === slots.length;
}
