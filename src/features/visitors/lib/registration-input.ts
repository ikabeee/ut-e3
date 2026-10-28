import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { readFormText } from "@shared/lib/form-data";

export type RegistrationField = "fullName" | "gamertag" | "email";

export type RegistrationFieldErrors = Partial<Record<RegistrationField, string>>;

export interface ValidRegistrationInput {
  fullName: string;
  gamertag: string;
  email: string;
}

export type ParseRegistrationResult =
  { ok: true; value: ValidRegistrationInput } | { ok: false; fieldErrors: RegistrationFieldErrors };

const GAMERTAG_REGEX = /^[A-Za-z0-9_-]{3,20}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function parseRegistrationInput(form: FormData): ParseRegistrationResult {
  const fullName = readFormText(form, "fullName").trim();
  const gamertag = readFormText(form, "gamertag").trim();
  const email = readFormText(form, "email").trim().toLowerCase();

  const fieldErrors: RegistrationFieldErrors = {};

  if (!fullName) {
    fieldErrors.fullName = VISITORS_COPY.errors.fullNameRequired;
  } else if (fullName.length < 3 || fullName.length > 80) {
    fieldErrors.fullName = VISITORS_COPY.errors.fullNameLength;
  }

  if (!gamertag) {
    fieldErrors.gamertag = VISITORS_COPY.errors.gamertagRequired;
  } else if (gamertag.length < 3 || gamertag.length > 20) {
    fieldErrors.gamertag = VISITORS_COPY.errors.gamertagLength;
  } else if (!GAMERTAG_REGEX.test(gamertag)) {
    fieldErrors.gamertag = VISITORS_COPY.errors.gamertagFormat;
  }

  if (!email) {
    fieldErrors.email = VISITORS_COPY.errors.emailRequired;
  } else if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = VISITORS_COPY.errors.emailInvalid;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: { fullName, gamertag, email },
  };
}
