import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { SqlCell, SqlReadResult } from "@features/admin/lib/types";

const COPY = ADMIN_COPY.sql;

const CELL_STYLES: Record<SqlCell["kind"], string> = {
  value: "",
  null: "text-muted italic",
  blob: "text-warning",
};

/** The rows of a read in a region that scrolls both ways, so a wide result never widens the page on a phone. */
export function SqlResultTable({ result }: Readonly<{ result: SqlReadResult }>) {
  if (result.rows.length === 0) return <p className="text-sm text-muted">{COPY.noRows}</p>;

  return (
    <div
      role="region"
      aria-label={COPY.resultHeading}
      tabIndex={0}
      className="max-h-[70svh] overflow-auto border border-border"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr>
            {result.columns.map((column, position) => (
              <th key={`${position}-${column}`} scope="col" className="border-b border-border px-3 py-2 type-mono">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowPosition) => (
            <ResultRow key={rowPosition} cells={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultRow({ cells }: Readonly<{ cells: readonly SqlCell[] }>) {
  return (
    <tr className="border-b border-border last:border-b-0">
      {cells.map((cell, position) => (
        <td key={position} className={`max-w-80 px-3 py-2 align-top wrap-break-word ${CELL_STYLES[cell.kind]}`}>
          {cell.text}
        </td>
      ))}
    </tr>
  );
}
