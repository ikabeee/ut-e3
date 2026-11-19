import { MAX_STAND_STAFF } from "@features/accounts/lib/invitation-rules";
import { isSecondaryRole } from "@features/accounts/lib/secondary-role";
import {
  ACCOUNT_ROLES,
  KOF_DESKS,
  type AccountRole,
  type KofDesk,
  type SecondaryRole,
} from "@features/accounts/lib/types";

/** The header of the list of staff (T7): UTF-8, comma-separated, one person per row. */
export const STAFF_CSV_HEADER = ["email", "name", "role", "secondary_role", "stand", "kof_desk"] as const;

/** A stand named by its group and studio, like `101-5`; the script looks its zone and number up in the event list. */
export interface StandCode {
  groupCode: string;
  studio: number;
}

export interface StaffInvitationRow {
  /** The line of the file, for the messages: the header is line 1. */
  line: number;
  email: string;
  name: string;
  role: AccountRole;
  secondaryRole: SecondaryRole | null;
  stand: StandCode | null;
  kofDesk: KofDesk | null;
}

export interface StaffCsvError {
  line: number;
  message: string;
}

export interface StaffCsvResult {
  /** The valid rows; empty when there is any error, because nothing is written then. */
  rows: StaffInvitationRow[];
  /** The people without an email: they are left out and reported, not an error. */
  omitted: { line: number; name: string }[];
  errors: StaffCsvError[];
}

interface CsvRecord {
  line: number;
  fields: string[];
}

type Reading<Value> = { ok: true; value: Value } | { ok: false; problem: string };

const EMAIL_FORMAT = /^[^\s@,;]+@[^\s@,;.]+(?:\.[^\s@,;.]+)+$/;

const STAND_FORMAT = /^(\d{3})-(\d)$/;

// A field is quoted ("" inside is a quote) or runs to the next comma or line end; the group after it is what ends it.
const CSV_TOKEN = /("[^"]*(?:""[^"]*)*"|[^,"\r\n]*)(,|\r\n|\n|\r|$)/y;

/**
 * Reads the whole list and returns every problem at once, so the person fixes the file once. It only knows the file:
 * whether a stand exists or a desk is taken in the database is checked later, against it.
 */
export function parseStaffInvitationCsv(text: string): StaffCsvResult {
  const split = splitRecords(text);

  if (split.kind === "broken") return fail({ line: split.line, message: "Hay comillas sin cerrar o mal puestas" });

  const [header, ...records] = split.records;

  if (!hasHeader(header)) {
    return fail({ line: 1, message: `La primera línea debe ser el encabezado: ${STAFF_CSV_HEADER.join(",")}` });
  }

  return readRows(records.filter((record) => !isBlank(record)));
}

function fail(error: StaffCsvError): StaffCsvResult {
  return { rows: [], omitted: [], errors: [error] };
}

function hasHeader(record: CsvRecord | undefined): boolean {
  if (!record || record.fields.length !== STAFF_CSV_HEADER.length) return false;

  return STAFF_CSV_HEADER.every((column, index) => record.fields[index].trim().toLowerCase() === column);
}

function isBlank(record: CsvRecord): boolean {
  return record.fields.every((field) => field.trim() === "");
}

function readRows(records: CsvRecord[]): StaffCsvResult {
  const rows: StaffInvitationRow[] = [];
  const omitted: StaffCsvResult["omitted"] = [];
  const errors: StaffCsvError[] = [];

  for (const record of records) {
    const reading = readRecord(record);

    if (reading.kind === "row") rows.push(reading.row);

    if (reading.kind === "omitted") omitted.push({ line: record.line, name: reading.name });

    if (reading.kind === "errors") errors.push(...reading.problems.map((message) => ({ line: record.line, message })));
  }

  errors.push(...findCrossRowErrors(rows));

  return { rows: errors.length === 0 ? rows : [], omitted, errors: errors.sort((a, b) => a.line - b.line) };
}

type RecordReading =
  { kind: "row"; row: StaffInvitationRow } | { kind: "omitted"; name: string } | { kind: "errors"; problems: string[] };

function readRecord(record: CsvRecord): RecordReading {
  if (record.fields.length !== STAFF_CSV_HEADER.length) {
    return {
      kind: "errors",
      problems: [`Se esperaban ${STAFF_CSV_HEADER.length} columnas y hay ${record.fields.length}`],
    };
  }

  const [rawEmail, rawName, rawRole, rawSecondary, rawStand, rawDesk] = record.fields.map((field) => field.trim());

  if (rawEmail === "") return { kind: "omitted", name: rawName };

  const email = readEmail(rawEmail);
  const name = readName(rawName);
  const role = readRole(rawRole);
  const roleValue = role.ok ? role.value : null;
  const secondaryRole = readSecondaryRole(rawSecondary, roleValue);
  const stand = readStand(rawStand, roleValue);
  const kofDesk = readKofDesk(rawDesk, roleValue);

  if (email.ok && name.ok && role.ok && secondaryRole.ok && stand.ok && kofDesk.ok) {
    return {
      kind: "row",
      row: {
        line: record.line,
        email: email.value,
        name: name.value,
        role: role.value,
        secondaryRole: secondaryRole.value,
        stand: stand.value,
        kofDesk: kofDesk.value,
      },
    };
  }

  const readings = [email, name, role, secondaryRole, stand, kofDesk];

  return { kind: "errors", problems: readings.flatMap((reading) => (reading.ok ? [] : [reading.problem])) };
}

function readEmail(value: string): Reading<string> {
  const email = value.toLowerCase();

  return EMAIL_FORMAT.test(email) ? ok(email) : problem("El correo no tiene un formato válido");
}

function readName(value: string): Reading<string> {
  return value === "" ? problem("Falta el nombre") : ok(value);
}

function readRole(value: string): Reading<AccountRole> {
  if (value === "") return problem("Falta el rol");

  const role = ACCOUNT_ROLES.find((candidate) => candidate === value);

  return role ? ok(role) : problem(`El rol "${value}" no existe`);
}

function readSecondaryRole(value: string, role: AccountRole | null): Reading<SecondaryRole | null> {
  if (value === "") return ok(null);

  if (!isSecondaryRole(value)) return problem(`El rol secundario "${value}" no existe`);

  return role === null || role === "stand_admin"
    ? ok(value)
    : problem("Solo un stand_admin puede tener rol secundario");
}

function readStand(value: string, role: AccountRole | null): Reading<StandCode | null> {
  const hasStandRole = role === "stand_admin" || role === "stand_staff";

  if (value === "") return hasStandRole ? problem("Falta el stand (grupo-estudio, como 101-5)") : ok(null);

  if (role !== null && !hasStandRole) return problem("Solo stand_admin y stand_staff llevan stand");

  const match = STAND_FORMAT.exec(value);

  return match
    ? ok({ groupCode: match[1], studio: Number(match[2]) })
    : problem(`El stand "${value}" no tiene el formato grupo-estudio, como 101-5`);
}

function readKofDesk(value: string, role: AccountRole | null): Reading<KofDesk | null> {
  if (value === "") return role === "kof_staff" ? problem("Falta la mesa de KOF (1 a 4)") : ok(null);

  if (role !== null && role !== "kof_staff") return problem("Solo kof_staff lleva mesa de KOF");

  const desk = KOF_DESKS.find((candidate) => String(candidate) === value);

  return desk ? ok(desk) : problem(`La mesa "${value}" debe ser un número de 1 a 4`);
}

function ok<Value>(value: Value): Reading<Value> {
  return { ok: true, value };
}

function problem(message: string): Reading<never> {
  return { ok: false, problem: message };
}

/** What only the whole list shows: a repeated email, two administrators or more than 3 staff in a stand, a shared desk. */
function findCrossRowErrors(rows: StaffInvitationRow[]): StaffCsvError[] {
  return [
    ...findRepeats(rows, {
      keyOf: (row) => row.email,
      describe: (_key, first) => `El correo se repite (primera vez en la línea ${first})`,
    }),
    ...findRepeats(rows, {
      keyOf: (row) => (row.role === "stand_admin" && row.stand ? formatStand(row.stand) : null),
      describe: (stand, first) => `El stand ${stand} ya tiene administrador en la línea ${first}`,
    }),
    ...findRepeats(rows, {
      keyOf: (row) => (row.kofDesk === null ? null : String(row.kofDesk)),
      describe: (desk, first) => `La mesa ${desk} ya la tiene la línea ${first}`,
    }),
    ...findStandsOverStaffLimit(rows),
  ];
}

interface RepeatRule {
  keyOf: (row: StaffInvitationRow) => string | null;
  describe: (key: string, firstLine: number) => string;
}

// The second and later rows with the same key are the errors; the first one is the one that keeps the place.
function findRepeats(rows: StaffInvitationRow[], rule: RepeatRule): StaffCsvError[] {
  const firstLines = new Map<string, number>();
  const errors: StaffCsvError[] = [];

  for (const row of rows) {
    const key = rule.keyOf(row);

    if (key === null) continue;

    const firstLine = firstLines.get(key);

    if (firstLine === undefined) firstLines.set(key, row.line);
    else errors.push({ line: row.line, message: rule.describe(key, firstLine) });
  }

  return errors;
}

function findStandsOverStaffLimit(rows: StaffInvitationRow[]): StaffCsvError[] {
  const counts = new Map<string, number>();
  const errors: StaffCsvError[] = [];

  for (const row of rows) {
    if (row.role !== "stand_staff" || !row.stand) continue;

    const stand = formatStand(row.stand);
    const count = (counts.get(stand) ?? 0) + 1;

    counts.set(stand, count);

    if (count > MAX_STAND_STAFF) {
      errors.push({ line: row.line, message: `El stand ${stand} tendría más de ${MAX_STAND_STAFF} staff` });
    }
  }

  return errors;
}

/** The stand as the list writes it, like `101-5`. */
export function formatStand(stand: StandCode): string {
  return `${stand.groupCode}-${stand.studio}`;
}

type Split = { kind: "split"; records: CsvRecord[] } | { kind: "broken"; line: number };

// A quote that does not close or sits in the middle of a field breaks the file; its line is where the record starts.
function splitRecords(text: string): Split {
  const source = text.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let line = 1;
  let recordLine = 1;

  CSV_TOKEN.lastIndex = 0;

  while (CSV_TOKEN.lastIndex <= source.length) {
    const token = CSV_TOKEN.exec(source);

    if (token === null) return { kind: "broken", line: recordLine };

    fields.push(unquote(token[1]));
    line += countLineBreaks(token[0]);

    if (token[2] === ",") continue;

    records.push({ line: recordLine, fields });
    fields = [];
    recordLine = line;

    if (token[2] === "") break;
  }

  return { kind: "split", records };
}

function unquote(field: string): string {
  return field.startsWith('"') ? field.slice(1, -1).replaceAll('""', '"') : field;
}

function countLineBreaks(text: string): number {
  return (text.match(/\r\n|\n|\r/g) ?? []).length;
}
