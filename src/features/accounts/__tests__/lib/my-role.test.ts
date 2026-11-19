import { MY_ROLE_PATH } from "@features/accounts/lib/accounts-links";
import { buildMyRoleCards, type MyRoleContext } from "@features/accounts/lib/my-role";
import { ACCOUNT_ROLES } from "@features/accounts/lib/types";

const CLOCK_TIME = /\d{1,2}:\d{2}/;

const NO_AREA: MyRoleContext = {
  stand: null,
  kofDesk: null,
  paths: { standGame: "/stand/game", standTeam: "/stand/team" },
};

const WITH_STAND: MyRoleContext = {
  ...NO_AREA,
  stand: { code: "ZA-S1-E6-101", gameName: "Make 'Em Fall", adminName: "Rosa Pérez" },
};

describe("MY_ROLE_PATH", () => {
  it("is the private page of the role", () => {
    expect(MY_ROLE_PATH).toBe("/my-role");
  });
});

describe("buildMyRoleCards", () => {
  it.each(ACCOUNT_ROLES)("explains the %s with steps, screens and who to ask, without hours", (role) => {
    const [card] = buildMyRoleCards([role], WITH_STAND);

    expect(card.role).toBe(role);
    expect(card.title).not.toBe("");
    expect(card.summary).not.toBe("");
    expect(card.steps.length).toBeGreaterThanOrEqual(2);
    expect(card.screens.length).toBeGreaterThanOrEqual(1);
    expect(card.contact).not.toBe("");
    expect([card.summary, ...card.steps, card.placement ?? "", card.contact].join(" ")).not.toMatch(CLOCK_TIME);
  });

  it.each([
    ["sysadmin", ["/admin", "/admin/kof", "/admin/raffle", "/support/recovery"]],
    ["stand_admin", ["/stand/kiosk", "/stand/game", "/stand/team"]],
    ["stand_staff", ["/stand/kiosk"]],
    ["kof_admin", ["/admin/kof"]],
    ["kof_staff", ["/admin/kof"]],
    ["raffle_admin", ["/admin/raffle"]],
    ["help_desk", ["/support/recovery"]],
  ])("links the %s to its screens", (role, hrefs) => {
    const [card] = buildMyRoleCards([role], WITH_STAND);

    expect(card.screens.map((screen) => screen.href)).toEqual(hrefs);
    expect(card.screens.every((screen) => screen.label !== "")).toBe(true);
  });

  it("gives the stand code and the game of a stand account", () => {
    const [admin, staff] = [
      buildMyRoleCards(["stand_admin"], WITH_STAND)[0],
      buildMyRoleCards(["stand_staff"], WITH_STAND)[0],
    ];

    expect(admin.placement).toContain("ZA-S1-E6-101");
    expect(admin.placement).toContain("Make 'Em Fall");
    expect(staff.placement).toContain("ZA-S1-E6-101");
  });

  it("gives only the code to a stand without a game", () => {
    const stand = { code: "ZB-S1-E2-103", gameName: null, adminName: null };
    const [card] = buildMyRoleCards(["stand_admin"], { ...NO_AREA, stand });

    expect(card.placement).toContain("ZB-S1-E2-103");
  });

  it.each([1, 2, 3, 4] as const)("gives the desk %i and its board to the KOF staff", (desk) => {
    const [card] = buildMyRoleCards(["kof_staff"], { ...NO_AREA, kofDesk: desk });

    expect(card.placement).toContain(`Mesa ${desk}`);
    expect(card.placement).toContain(`tablero ${desk}`);
  });

  it("says that a KOF staff member without a desk has none yet and sends it to the sysadmin", () => {
    const [card] = buildMyRoleCards(["kof_staff"], NO_AREA);

    expect(card.placement).not.toBeNull();
    expect(card.placement).not.toContain("Mesa 1");
    expect(card.contact).toContain("sysadmin");
  });

  it("says in the steps of the KOF staff that the semifinals and the final are for the administrator", () => {
    const [staff, admin] = [buildMyRoleCards(["kof_staff"], NO_AREA)[0], buildMyRoleCards(["kof_admin"], NO_AREA)[0]];

    expect(staff.steps.join(" ")).toMatch(/semifinales/);
    expect(admin.steps.join(" ")).toMatch(/semifinales/);
  });

  it("sends the stand staff to the administrator of its stand by name", () => {
    const [card] = buildMyRoleCards(["stand_staff"], WITH_STAND);

    expect(card.contact).toContain("Rosa Pérez");
    expect(card.contact).not.toContain("sysadmin");
  });

  it("sends the stand staff to the sysadmin when the stand has no active administrator", () => {
    const stand = { code: "ZA-S1-E6-101", gameName: null, adminName: null };
    const [card] = buildMyRoleCards(["stand_staff"], { ...NO_AREA, stand });

    expect(card.contact).toContain("sysadmin");
  });

  it.each(["sysadmin", "stand_admin", "kof_admin", "kof_staff", "raffle_admin", "help_desk"])(
    "sends the %s to the sysadmin",
    (role) => {
      const [card] = buildMyRoleCards([role], WITH_STAND);

      expect(card.contact).toContain("sysadmin");
    },
  );

  it("gives an area, not a stand or a desk, to the roles that have neither", () => {
    const cards = buildMyRoleCards(["raffle_admin", "help_desk", "sysadmin", "kof_admin"], WITH_STAND);

    for (const card of cards) {
      expect(card.placement).not.toBeNull();
      expect(card.placement).not.toContain("ZA-S1-E6-101");
    }
  });

  it("returns one card per role of an account with two roles, the primary first", () => {
    const cards = buildMyRoleCards(["stand_admin", "kof_admin"], WITH_STAND);

    expect(cards.map((card) => card.role)).toEqual(["stand_admin", "kof_admin"]);
    expect(cards[0].placement).toContain("ZA-S1-E6-101");
    expect(cards[1].screens.map((screen) => screen.href)).toEqual(["/admin/kof"]);
    expect(cards[1].contact).toContain("sysadmin");
  });

  it("keeps the role of an account with two roles that share nothing from repeating", () => {
    const cards = buildMyRoleCards(["stand_admin", "stand_admin"], WITH_STAND);

    expect(cards).toHaveLength(1);
  });

  it("shows nothing for a role that is not a role of the app", () => {
    expect(buildMyRoleCards(["visitor"], WITH_STAND)).toEqual([]);
    expect(buildMyRoleCards([], WITH_STAND)).toEqual([]);
  });
});
