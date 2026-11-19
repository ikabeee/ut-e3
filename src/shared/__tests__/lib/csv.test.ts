import { buildCsv } from "@shared/lib/csv";

describe("buildCsv", () => {
  it("joins rows with CRLF and closes with one", () => {
    expect(
      buildCsv([
        ["a", 1],
        ["b", 2],
      ]),
    ).toBe("a,1\r\nb,2\r\n");
  });

  it.each(["=1+1", "+1", "-1", "@A1", "\tx", "\rx"])("quotes a cell that starts like a formula: %j", (cell) => {
    expect(buildCsv([[cell]]).startsWith(`"'`) || buildCsv([[cell]]).startsWith("'")).toBe(true);
  });

  it("wraps cells with commas, quotes or line breaks and doubles the quotes", () => {
    expect(buildCsv([['a,"b"', "x\ny"]])).toBe('"a,""b""","x\ny"\r\n');
  });
});
