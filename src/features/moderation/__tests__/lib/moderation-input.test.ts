import { parseReason, REASON_MAX_LENGTH } from "@features/moderation/lib/moderation-input";

function formWith(reason: string): FormData {
  const form = new FormData();

  form.set("reason", reason);

  return form;
}

describe("parseReason (RF-46)", () => {
  it("keeps a readable reason with its spaces collapsed", () => {
    expect(parseReason(formWith("  Visita   duplicada \n en ZA-S1 "))).toEqual({
      isValid: true,
      reason: "Visita duplicada en ZA-S1",
    });
  });

  it("accepts emojis next to words and keeps them as typed", () => {
    expect(parseReason(formWith("Fraude 👨‍👩‍👧 grupal"))).toEqual({ isValid: true, reason: "Fraude 👨‍👩‍👧 grupal" });
  });

  it.each([
    ["empty", ""],
    ["too short", "abc"],
    ["only punctuation", "....."],
    ["only emojis", "🙂🙂🙂🙂🙂"],
    ["only zero-width spaces", "​​​​​​"],
    ["two letters hidden among zero-width joiners", "a‍‍‍‍b"],
    ["too long", "a".repeat(REASON_MAX_LENGTH + 1)],
    ["ten thousand characters", "motivo ".repeat(1500)],
  ])("refuses a reason that is %s", (_case, reason) => {
    expect(parseReason(formWith(reason))).toEqual({ isValid: false });
  });

  it("refuses a missing field or a file sent in its place", () => {
    const form = new FormData();

    expect(parseReason(form)).toEqual({ isValid: false });

    form.set("reason", new File(["Visita duplicada"], "reason.txt"));

    expect(parseReason(form)).toEqual({ isValid: false });
  });
});
