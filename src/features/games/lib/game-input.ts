import { GAMES_COPY } from "@features/games/lib/games-copy";
import { readFormText } from "@shared/lib/form-data";

export interface StandGameInput {
  name: string;
  synopsis: string;
  genreId: string;
  itchUrl: string | null;
}

export type ParsedStandGameInput = { isValid: true; input: StandGameInput } | { isValid: false; message: string };

export const GAME_NAME_MAX_LENGTH = 80;

export const GAME_SYNOPSIS_MAX_LENGTH = 400;

const ITCH_URL_MAX_LENGTH = 200;

const ERRORS = GAMES_COPY.standGame.errors;

/** Reads the form of the stand administrator (RF-31). The stand never comes from the form: the session decides it. */
export function parseStandGameInput(form: FormData): ParsedStandGameInput {
  const name = readFormText(form, "name").trim();
  const synopsis = readFormText(form, "synopsis").trim();
  const genreId = readFormText(form, "genreId").trim();
  const itchUrl = parseItchUrl(readFormText(form, "itchUrl").trim());

  if (!name || name.length > GAME_NAME_MAX_LENGTH) return invalid(ERRORS.nameRequired);

  if (!synopsis || synopsis.length > GAME_SYNOPSIS_MAX_LENGTH) return invalid(ERRORS.synopsisRequired);

  if (!genreId) return invalid(ERRORS.genreInvalid);

  if (itchUrl === "invalid") return invalid(ERRORS.itchInvalid);

  return { isValid: true, input: { name, synopsis, genreId, itchUrl } };
}

function invalid(message: string): ParsedStandGameInput {
  return { isValid: false, message };
}

// Empty means no link; otherwise an https address on itch.io or one of its subdomains.
function parseItchUrl(value: string): string | null | "invalid" {
  if (value === "") return null;

  if (value.length > ITCH_URL_MAX_LENGTH || !URL.canParse(value)) return "invalid";

  const url = new URL(value);
  const isItch = url.hostname === "itch.io" || url.hostname.endsWith(".itch.io");

  return url.protocol === "https:" && isItch ? url.toString() : "invalid";
}
