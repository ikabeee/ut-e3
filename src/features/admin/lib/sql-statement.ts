import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

const ERRORS = ADMIN_COPY.sql.errors;

/** A WITH counts as what its main statement, after the CTEs, is. */
export type SqlStatementKind = "read" | "write";

export type ParsedSqlStatement =
  { isValid: true; kind: SqlStatementKind; text: string } | { isValid: false; message: string };

export const MAX_SQL_LENGTH = 10_000;

const READ_KEYWORDS = new Set(["select", "explain"]);

const WRITE_KEYWORDS = new Set(["insert", "update", "delete"]);

// Named in their own message: they are the ones somebody tries first.
const FORBIDDEN_KEYWORDS = new Set(["attach", "detach", "pragma", "vacuum", "create", "drop", "alter"]);

const EXPLAIN_FILLER = new Set(["query", "plan"]);

const PROTECTED_TABLE_PREFIXES = ["sqlite_"];

const PROTECTED_TABLES = new Set(["_prisma_migrations", "audit_logs"]);

// The pieces of the tokenizer, in the order they are tried: whitespace, comments, string literals, quoted names, words,
// and any other single character.
const TOKEN_PARTS = [
  /\s+/,
  /--[^\n]*/,
  /\/\*[\s\S]*?(?:\*\/|$)/,
  /'(?:[^']|'')*'?/,
  /"(?:[^"]|"")*"?/,
  /`(?:[^`]|``)*`?/,
  /\[[^\]]*\]?/,
  /\$?\w+/,
  /[\s\S]/,
];

const TOKEN_PATTERN = new RegExp(TOKEN_PARTS.map((part) => part.source).join("|"), "g");

interface SqlWord {
  text: string;
  /** Quoted names and string literals are never keywords: `"delete"` is a name, not the statement. */
  isQuoted: boolean;
}

interface SqlTokens {
  /** Words, quoted names and string literals in lower case; comments and symbols are not words. */
  words: SqlWord[];
  /** The words outside every parenthesis: after the CTEs of a WITH, the first DML keyword is its main statement. */
  topLevelWords: SqlWord[];
  hasSecondStatement: boolean;
}

/**
 * Reads the text the way SQLite does for the purposes of the console: one statement, starting with an allowed
 * keyword. It looks at words only, never inside string literals or comments, so `'a; b'` is not a second statement.
 * Only unquoted words decide what the statement is; every word, quoted or not, can name a protected table, because
 * SQLite accepts `"audit_logs"`, `[audit_logs]`, backticks and even `'audit_logs'` as a table name.
 */
export function parseSqlStatement(input: string): ParsedSqlStatement {
  if (input.length > MAX_SQL_LENGTH) return reject(ERRORS.tooLong);

  const { words, topLevelWords, hasSecondStatement } = tokenize(input);

  if (words.length === 0) return reject(ERRORS.empty);

  if (hasSecondStatement) return reject(ERRORS.multiple);

  return classify(input.trim(), words, topLevelWords);
}

function classify(text: string, words: readonly SqlWord[], topLevelWords: readonly SqlWord[]): ParsedSqlStatement {
  if (words[0].isQuoted) return reject(ERRORS.notAllowed);

  const first = words[0].text;

  if (FORBIDDEN_KEYWORDS.has(first)) return reject(ERRORS.forbidden(first.toUpperCase()));

  if (words.some((word) => word.text === "load_extension")) return reject(ERRORS.loadExtension);

  const kind = getKind(first, getLeadingKeyword(words), getKeywords(topLevelWords));

  if (!kind) return reject(ERRORS.notAllowed);

  if (kind === "write" && touchesProtectedTable(words)) return reject(ERRORS.protectedTable);

  if (isUnboundedRecursion(getKeywords(words))) return reject(ERRORS.recursiveWithoutLimit);

  return { isValid: true, kind, text };
}

function getKeywords(words: readonly SqlWord[]): string[] {
  return words.flatMap((word) => (word.isQuoted ? [] : [word.text]));
}

// EXPLAIN [QUERY PLAN] explains the statement that follows, which must be one of the allowed ones too.
function getLeadingKeyword(words: readonly SqlWord[]): string {
  if (words[0].text !== "explain") return words[0].text;

  const next = words.slice(1).find((word) => word.isQuoted || !EXPLAIN_FILLER.has(word.text));

  return next && !next.isQuoted ? next.text : "";
}

function getKind(first: string, leading: string, topLevelKeywords: readonly string[]): SqlStatementKind | null {
  if (first === "with") return getMainKind(topLevelKeywords.find(isDmlOrSelect) ?? "");

  if (first === "explain") return isDmlOrSelect(leading) || leading === "with" ? "read" : null;

  return getMainKind(first);
}

function getMainKind(keyword: string): SqlStatementKind | null {
  if (READ_KEYWORDS.has(keyword)) return "read";

  return WRITE_KEYWORDS.has(keyword) ? "write" : null;
}

function isDmlOrSelect(word: string): boolean {
  return word === "select" || WRITE_KEYWORDS.has(word);
}

function touchesProtectedTable(words: readonly SqlWord[]): boolean {
  return words.some(
    ({ text }) => PROTECTED_TABLES.has(text) || PROTECTED_TABLE_PREFIXES.some((prefix) => text.startsWith(prefix)),
  );
}

// A recursive query with no LIMIT can run forever, and better-sqlite3 cannot be interrupted from the same thread.
function isUnboundedRecursion(keywords: readonly string[]): boolean {
  return keywords.includes("recursive") && !keywords.includes("limit");
}

function tokenize(input: string): SqlTokens {
  const tokens: SqlTokens = { words: [], topLevelWords: [], hasSecondStatement: false };
  let hasSemicolon = false;
  let depth = 0;

  for (const [token] of input.matchAll(TOKEN_PATTERN)) {
    if (isBlank(token)) continue;

    tokens.hasSecondStatement ||= hasSemicolon;
    hasSemicolon ||= token === ";";
    depth += getDepthChange(token);

    const word = toWord(token);

    if (word) tokens.words.push(word);

    if (word && depth === 0) tokens.topLevelWords.push(word);
  }

  return tokens;
}

function getDepthChange(token: string): number {
  if (token === "(") return 1;

  return token === ")" ? -1 : 0;
}

function isBlank(token: string): boolean {
  return /^\s/.test(token) || token.startsWith("--") || token.startsWith("/*");
}

// A quoted name and a string literal keep their text, flagged as quoted; a symbol is not a word.
function toWord(token: string): SqlWord | null {
  const quote = token[0];

  if (quote === "'" || quote === '"' || quote === "`") {
    return {
      text: token
        .slice(1)
        .replace(/['"`]$/, "")
        .toLowerCase(),
      isQuoted: true,
    };
  }

  if (quote === "[") return { text: token.slice(1).replace(/\]$/, "").toLowerCase(), isQuoted: true };

  return /^\w/.test(token) ? { text: token.toLowerCase(), isQuoted: false } : null;
}

function reject(message: string): ParsedSqlStatement {
  return { isValid: false, message };
}
