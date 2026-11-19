/**
 * Rows as CSV for a spreadsheet, with CRLF line ends and a closing one. A cell that starts like a formula ("=", "+",
 * "-", "@") or with a tab or return gets a quote in front, so the spreadsheet shows it instead of running it.
 */
export function buildCsv(rows: readonly (readonly (string | number)[])[]): string {
  return rows.map((row) => row.map(toCell).join(",")).join("\r\n") + "\r\n";
}

function toCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
