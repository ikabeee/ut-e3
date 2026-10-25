import { formatPhone } from "@features/sponsors/lib/phone-format";

describe("formatPhone", () => {
  it("reads a Mexican E.164 number as three groups", () => {
    expect(formatPhone("+529981234567")).toBe("998 123 4567");
  });
});
