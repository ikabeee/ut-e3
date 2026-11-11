import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { readFormText } from "@shared/lib/form-data";

export interface RecoveryInput {
  fullName: string;
  gamertag: string;
}

export type ParseRecoveryResult = { ok: true; value: RecoveryInput } | { ok: false; message: string };

// A little above what registration accepts (80 and 20), so a long value is refused without reaching the database.
const MAX_FULL_NAME = 120;

const MAX_GAMERTAG = 40;

const ERRORS = SUPPORT_COPY.recovery.errors;

export function parseRecoveryInput(form: FormData): ParseRecoveryResult {
  const fullName = readFormText(form, "fullName").trim();
  const gamertag = readFormText(form, "gamertag").trim();

  if (!fullName) return { ok: false, message: ERRORS.fullNameRequired };

  if (!gamertag) return { ok: false, message: ERRORS.gamertagRequired };

  if (fullName.length > MAX_FULL_NAME || gamertag.length > MAX_GAMERTAG) {
    return { ok: false, message: ERRORS.fieldTooLong };
  }

  return { ok: true, value: { fullName, gamertag } };
}

/** The full name is compared without regard to case or repeated spaces; the gamertag is compared whole. */
export function normalizeFullName(fullName: string): string {
  return fullName.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("es-MX");
}
