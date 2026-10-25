import { formatStandCode } from "@features/games/lib/stand-code";

describe("formatStandCode", () => {
  it("builds the short code the visitor sees from the stand zone and number", () => {
    expect(formatStandCode({ zone: "A", number: 3 })).toBe("zA-s3");
  });

  it("keeps two-digit stand numbers", () => {
    expect(formatStandCode({ zone: "B", number: 12 })).toBe("zB-s12");
  });
});
