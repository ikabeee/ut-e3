import { formatStandCode } from "@features/games/lib/stand-code";

describe("formatStandCode", () => {
  it("builds the short code the visitor sees from the stand zone and number", () => {
    expect(formatStandCode({ zone: "A", number: 3 })).toBe("ZA-S3");
  });

  it("builds the code of a horror zone stand", () => {
    expect(formatStandCode({ zone: "T", number: 6 })).toBe("ZT-S6");
  });
});
