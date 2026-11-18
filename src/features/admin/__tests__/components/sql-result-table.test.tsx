import { render, screen, within } from "@testing-library/react";
import { SqlResultTable } from "@features/admin/components/sql-result-table";

describe("SqlResultTable", () => {
  it("shows the columns and rows in a scrollable region, marking null and blobs", () => {
    render(
      <SqlResultTable
        result={{
          columns: ["email", "nota"],
          rows: [
            [
              { kind: "value", text: "uno@ut.mx" },
              { kind: "null", text: "NULL" },
            ],
            [
              { kind: "value", text: "dos@ut.mx" },
              { kind: "blob", text: "[BLOB 2 bytes]" },
            ],
          ],
          isTruncated: false,
        }}
      />,
    );

    const region = screen.getByRole("region", { name: "Resultado" });

    expect(region).toHaveAttribute("tabindex", "0");
    expect(
      within(region)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["email", "nota"]);
    expect(within(region).getByText("NULL")).toHaveClass("italic");
    expect(within(region).getByText("[BLOB 2 bytes]")).toBeInTheDocument();
  });

  it("says so when the query returned no rows", () => {
    render(<SqlResultTable result={{ columns: ["email"], rows: [], isTruncated: false }} />);

    expect(screen.getByText("La consulta no devolvió filas.")).toBeInTheDocument();
  });
});
