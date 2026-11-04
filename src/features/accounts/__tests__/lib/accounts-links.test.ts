import { getHomePath } from "@features/accounts/lib/accounts-links";

describe("getHomePath", () => {
  it.each([
    ["help_desk", "/support/recovery"],
    ["kof_admin", "/admin/kof"],
    ["kof_staff", "/admin/kof"],
    ["stand_admin", "/stand/kiosk"],
    ["stand_staff", "/stand/kiosk"],
    ["sysadmin", "/admin"],
    ["raffle_admin", "/admin/raffle"],
  ])("sends a %s to %s", (role, path) => {
    expect(getHomePath(role)).toBe(path);
  });
});
