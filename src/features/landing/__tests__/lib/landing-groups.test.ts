import { formatGroupLabel, getGroupLabels } from "@features/landing/lib/landing-groups";

describe("formatGroupLabel", () => {
  it("separates the career code from the number with a space", () => {
    expect(formatGroupLabel("IDYGS101")).toBe("IDYGS 101");
  });
});

describe("getGroupLabels", () => {
  it("lists every student group in order", () => {
    expect(getGroupLabels()).toEqual(["IDYGS 101", "IDYGS 102", "IDYGS 103"]);
  });
});
