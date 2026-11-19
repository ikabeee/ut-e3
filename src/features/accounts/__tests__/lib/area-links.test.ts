import { getOtherAreaLink } from "@features/accounts/lib/area-links";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";

const AREAS = ACCOUNTS_COPY.areas;

describe("getOtherAreaLink (S1)", () => {
  it.each([
    ["help_desk", "/support/recovery"],
    ["kof_admin", "/admin/kof"],
    ["raffle_admin", "/admin/raffle"],
    ["sysadmin", "/admin"],
  ] as const)("leads a stand administrator with the secondary role %s from its stand to %s", (role, href) => {
    expect(getOtherAreaLink(["stand_admin", role], "primary")).toEqual({ href, label: AREAS.toRole[role] });
  });

  it.each(["help_desk", "kof_admin", "raffle_admin", "sysadmin"])(
    "leads the account with the secondary role %s back to its stand",
    (role) => {
      expect(getOtherAreaLink(["stand_admin", role], "secondary")).toEqual({
        href: "/stand/kiosk",
        label: AREAS.toStand,
      });
    },
  );

  it.each(["primary", "secondary"] as const)("has no other area for an account with one role (%s)", (from) => {
    expect(getOtherAreaLink(["stand_admin"], from)).toBeNull();
    expect(getOtherAreaLink(["sysadmin"], from)).toBeNull();
    expect(getOtherAreaLink([], from)).toBeNull();
  });

  it("has no other area when the second role is not one that a secondary role can be", () => {
    expect(getOtherAreaLink(["stand_admin", "stand_staff"], "primary")).toBeNull();
    expect(getOtherAreaLink(["stand_admin", "root"], "secondary")).toBeNull();
  });
});
