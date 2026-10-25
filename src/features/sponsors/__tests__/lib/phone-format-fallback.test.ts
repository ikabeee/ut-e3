import { formatPhone } from "@features/sponsors/lib/phone-format";

describe("formatPhone fallback", () => {
  it("returns a number that is not a +52 number with 10 digits as it came", () => {
    expect(formatPhone("+1 555 0100")).toBe("+1 555 0100");
    expect(formatPhone("+52998123456")).toBe("+52998123456");
  });

  it("trims the surrounding whitespace of the input", () => {
    expect(formatPhone("  +1 555 0100 ")).toBe("+1 555 0100");
    expect(formatPhone(" +529981234567 ")).toBe("998 123 4567");
  });
});
