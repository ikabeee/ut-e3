import { formatAdminStandCode, formatStandCode } from "@features/games/lib/stand-code";

describe("formatStandCode", () => {
  it("builds the short code the visitor sees from the stand zone and number", () => {
    expect(formatStandCode({ zone: "A", number: 3 })).toBe("ZA-S3");
  });

  it("builds the code of a horror zone stand", () => {
    expect(formatStandCode({ zone: "T", number: 6 })).toBe("ZT-S6");
  });
});

describe("formatAdminStandCode", () => {
  it("adds the studio and the group to the code of the visitor (RF-11)", () => {
    expect(formatAdminStandCode({ zone: "A", number: 1, studio: 6, groupCode: "101" })).toBe("ZA-S1-E6-101");
  });
});
