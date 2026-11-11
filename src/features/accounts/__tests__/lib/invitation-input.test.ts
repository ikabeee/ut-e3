import { parseInviteInput } from "@features/accounts/lib/invitation-input";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";

const ERRORS = ACCOUNTS_COPY.management.errors;

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}

describe("parseInviteInput", () => {
  it("reads the name, the lower-case email and the role", () => {
    const form = createForm({ name: "  Ana Pérez ", email: " Ana@UT.mx ", role: "kof_admin" });

    expect(parseInviteInput(form)).toEqual({
      isValid: true,
      input: { name: "Ana Pérez", email: "ana@ut.mx", role: "kof_admin", kofDesk: null },
    });
  });

  it.each([
    ["1", 1],
    ["2", 2],
  ] as const)("reads the desk %s of a staff member", (desk, expected) => {
    const form = createForm({ name: "Luis", email: "luis@ut.mx", role: "kof_staff", desk });

    expect(parseInviteInput(form)).toMatchObject({ isValid: true, input: { kofDesk: expected } });
  });

  it("reads an empty desk as no desk", () => {
    const form = createForm({ name: "Luis", email: "luis@ut.mx", role: "help_desk", desk: "" });

    expect(parseInviteInput(form)).toMatchObject({ isValid: true, input: { kofDesk: null } });
  });

  it.each([
    ["a missing name", { email: "a@ut.mx", role: "kof_admin" }, ERRORS.nameRequired],
    ["a blank name", { name: "   ", email: "a@ut.mx", role: "kof_admin" }, ERRORS.nameRequired],
    ["a name that is too long", { name: "x".repeat(81), email: "a@ut.mx", role: "kof_admin" }, ERRORS.nameRequired],
    ["a missing email", { name: "Ana", role: "kof_admin" }, ERRORS.emailInvalid],
    ["an email without an at sign", { name: "Ana", email: "ana.ut.mx", role: "kof_admin" }, ERRORS.emailInvalid],
    ["an email with spaces", { name: "Ana", email: "a na@ut.mx", role: "kof_admin" }, ERRORS.emailInvalid],
    ["a missing role", { name: "Ana", email: "a@ut.mx" }, ERRORS.roleRequired],
    ["a desk that does not exist", { name: "Ana", email: "a@ut.mx", role: "kof_staff", desk: "3" }, ERRORS.deskInvalid],
    [
      "a desk that is not a number",
      { name: "Ana", email: "a@ut.mx", role: "kof_staff", desk: "uno" },
      ERRORS.deskInvalid,
    ],
  ])("rejects %s", (_case, fields, message) => {
    expect(parseInviteInput(createForm(fields))).toEqual({ isValid: false, message });
  });

  it("rejects a name that arrives as a file", () => {
    const form = createForm({ email: "a@ut.mx", role: "kof_admin" });

    form.append("name", new File(["Ana"], "ana.txt"));

    expect(parseInviteInput(form)).toEqual({ isValid: false, message: ERRORS.nameRequired });
  });
});
