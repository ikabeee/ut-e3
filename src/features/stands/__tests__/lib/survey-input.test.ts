import { parsePin, parseRatings } from "@features/stands/lib/survey-input";

describe("parsePin", () => {
  it("accepts the 5 digits of a passport and ignores the spaces around them", () => {
    expect(parsePin("04821")).toBe("04821");
    expect(parsePin("  04821 ")).toBe("04821");
  });

  it.each(["", "1234", "123456", "12a45", "12 45", "１２３４５"])("rejects %j", (raw) => {
    expect(parsePin(raw)).toBeNull();
  });
});

describe("parseRatings", () => {
  it("reads the three ratings as numbers", () => {
    expect(parseRatings(createForm({ gameRating: "5", standRating: "1", artRating: "3" }))).toEqual({
      gameRating: 5,
      standRating: 1,
      artRating: 3,
    });
  });

  it.each([
    ["one rating missing", { gameRating: "5", standRating: "4" }],
    ["a rating of 0", { gameRating: "0", standRating: "4", artRating: "4" }],
    ["a rating of 6", { gameRating: "5", standRating: "6", artRating: "4" }],
    ["a decimal rating", { gameRating: "4.5", standRating: "4", artRating: "4" }],
    ["a rating that is not a number", { gameRating: "cinco", standRating: "4", artRating: "4" }],
    ["an empty form", {}],
  ])("answers null for %s", (_case, fields) => {
    expect(parseRatings(createForm(fields))).toBeNull();
  });
});

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}
