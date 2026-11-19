import { ACCOUNT_ROLES } from "@features/accounts/lib/types";
import {
  canManageAccount,
  canManageRole,
  getManagedRoles,
  INVITATION_TTL_MS,
  isInvitationExpired,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "@features/accounts/lib/invitation-rules";

describe("canManageRole (S7)", () => {
  it.each(["sysadmin", "kof_admin", "raffle_admin", "help_desk", "kof_staff", "stand_admin", "stand_staff"])(
    "lets the sysadmin manage a %s",
    (role) => {
      expect(canManageRole("sysadmin", role)).toBe(true);
    },
  );

  it("does not let the sysadmin manage a role that does not exist", () => {
    expect(canManageRole("sysadmin", "other")).toBe(false);
  });

  it("lets the KOF administrator manage only the KOF staff", () => {
    expect(canManageRole("kof_admin", "kof_staff")).toBe(true);
    expect(canManageRole("kof_admin", "kof_admin")).toBe(false);
    expect(canManageRole("kof_admin", "help_desk")).toBe(false);
    expect(canManageRole("kof_admin", "sysadmin")).toBe(false);
  });

  it.each(["kof_staff", "raffle_admin", "help_desk", "stand_admin", "stand_staff"])(
    "does not let a %s manage anyone",
    (actor) => {
      expect(canManageRole(actor, "kof_staff")).toBe(false);
      expect(canManageRole(actor, "help_desk")).toBe(false);
    },
  );

  it("lists what each manager can invite", () => {
    expect(getManagedRoles("sysadmin")).toEqual(["kof_admin", "raffle_admin", "help_desk"]);
    expect(getManagedRoles("kof_admin")).toEqual(["kof_staff"]);
    expect(getManagedRoles("kof_staff")).toEqual([]);
  });
});

describe("invitations expire after 72 hours (S1)", () => {
  const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");

  it("lasts 72 hours", () => {
    expect(INVITATION_TTL_MS).toBe(72 * 60 * 60 * 1000);
  });

  it("is valid until the moment it expires and not after", () => {
    const expiresAt = new Date(CREATED_AT.getTime() + INVITATION_TTL_MS);

    expect(isInvitationExpired(expiresAt, new Date(expiresAt.getTime() - 1))).toBe(false);
    expect(isInvitationExpired(expiresAt, expiresAt)).toBe(true);
    expect(isInvitationExpired(expiresAt, new Date(expiresAt.getTime() + 1))).toBe(true);
  });
});

describe("validateNewPassword (S6)", () => {
  const LONG_ENOUGH = "x".repeat(MIN_PASSWORD_LENGTH);

  it("accepts a password of at least 12 characters that matches its confirmation", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(validateNewPassword(LONG_ENOUGH, LONG_ENOUGH)).toBeNull();
  });

  it("names the problem of a short password", () => {
    expect(validateNewPassword("x".repeat(11), "x".repeat(11))).toBe("tooShort");
  });

  it("names the problem of a confirmation that does not match", () => {
    expect(validateNewPassword(LONG_ENOUGH, `${LONG_ENOUGH}y`)).toBe("mismatch");
  });

  it("counts the characters as typed, without trimming the spaces", () => {
    expect(validateNewPassword(" ".repeat(12), " ".repeat(12))).toBeNull();
  });
});

describe("canManageAccount (RF-32)", () => {
  const OWN_STAND = "stand-1";

  const standAdmin = { role: "stand_admin", standId: OWN_STAND };

  it("lets the stand administrator manage the staff of its own stand", () => {
    expect(canManageAccount({ actor: standAdmin, target: { role: "stand_staff", standId: OWN_STAND } })).toBe(true);
  });

  it("does not let it manage the staff of another stand", () => {
    expect(canManageAccount({ actor: standAdmin, target: { role: "stand_staff", standId: "stand-2" } })).toBe(false);
  });

  it("does not let a stand administrator without a stand manage anyone", () => {
    const actor = { role: "stand_admin", standId: null };

    expect(canManageAccount({ actor, target: { role: "stand_staff", standId: null } })).toBe(false);
  });

  it("does not let it manage another administrator or the roles of other panels", () => {
    expect(canManageAccount({ actor: standAdmin, target: { role: "stand_admin", standId: OWN_STAND } })).toBe(false);
    expect(canManageAccount({ actor: standAdmin, target: { role: "kof_staff", standId: null } })).toBe(false);
  });

  it("lets the sysadmin manage the accounts of every role, with or without a stand", () => {
    const actor = { role: "sysadmin" };

    expect(canManageAccount({ actor, target: { role: "stand_admin", standId: OWN_STAND } })).toBe(true);
    expect(canManageAccount({ actor, target: { role: "stand_staff", standId: OWN_STAND } })).toBe(true);
    expect(canManageAccount({ actor, target: { role: "sysadmin", standId: null } })).toBe(true);
    expect(canManageAccount({ actor, target: { role: "kof_staff", standId: null } })).toBe(true);
    expect(canManageAccount({ actor, target: { role: "other", standId: null } })).toBe(false);
  });

  it("keeps the rules by role of the other panels", () => {
    expect(canManageAccount({ actor: { role: "kof_admin" }, target: { role: "kof_staff", standId: null } })).toBe(true);
    expect(canManageAccount({ actor: { role: "stand_staff" }, target: { role: "stand_staff", standId: null } })).toBe(
      false,
    );
  });
});

// The rules of the managers that are not the sysadmin, frozen: the sysadmin's extension must not widen them.
describe("what the other managers can act on", () => {
  const STAND = "stand-1";

  it.each(ACCOUNT_ROLES.filter((role) => role !== "sysadmin"))("freezes the matrix of the %s", (actorRole) => {
    for (const targetRole of ACCOUNT_ROLES) {
      const actor = { role: actorRole, standId: actorRole === "stand_admin" ? STAND : null };
      const sameStand = canManageAccount({ actor, target: { role: targetRole, standId: STAND } });
      const otherStand = canManageAccount({ actor, target: { role: targetRole, standId: "stand-2" } });
      const noStand = canManageAccount({ actor, target: { role: targetRole, standId: null } });

      expect({ targetRole, sameStand, otherStand, noStand }).toEqual({
        targetRole,
        sameStand: isAllowed(actorRole, targetRole),
        otherStand: isAllowed(actorRole, targetRole) && actorRole !== "stand_admin",
        noStand: isAllowed(actorRole, targetRole) && actorRole !== "stand_admin",
      });
    }
  });

  function isAllowed(actorRole: string, targetRole: string): boolean {
    return (
      (actorRole === "kof_admin" && targetRole === "kof_staff") ||
      (actorRole === "stand_admin" && targetRole === "stand_staff")
    );
  }
});

// L14: a secondary KOF administrator invites KOF staff like a primary one; the stand scope stays with the stand role.
describe("what an account with a secondary role can act on", () => {
  const STAND = "stand-1";

  const dualKof = { role: "stand_admin", secondaryRole: "kof_admin", standId: STAND };

  it("lets a stand administrator with the secondary role kof_admin manage KOF staff and its own stand's staff", () => {
    expect(canManageRole("stand_admin", "kof_staff", "kof_admin")).toBe(true);
    expect(canManageRole("stand_admin", "stand_staff", "kof_admin")).toBe(true);
    expect(canManageAccount({ actor: dualKof, target: { role: "kof_staff", standId: null } })).toBe(true);
    expect(canManageAccount({ actor: dualKof, target: { role: "stand_staff", standId: STAND } })).toBe(true);
  });

  it("keeps the stand scope: the secondary role does not open the staff of another stand", () => {
    expect(canManageAccount({ actor: dualKof, target: { role: "stand_staff", standId: "stand-2" } })).toBe(false);
  });

  it("does not widen anything else for a secondary kof_admin", () => {
    expect(canManageRole("stand_admin", "kof_admin", "kof_admin")).toBe(false);
    expect(canManageRole("stand_admin", "help_desk", "kof_admin")).toBe(false);
    expect(canManageAccount({ actor: dualKof, target: { role: "stand_admin", standId: STAND } })).toBe(false);
    expect(canManageAccount({ actor: dualKof, target: { role: "sysadmin", standId: null } })).toBe(false);
  });

  it.each(["help_desk", "raffle_admin"])("gives a secondary %s no accounts to manage", (secondaryRole) => {
    expect(canManageRole("stand_admin", "kof_staff", secondaryRole)).toBe(false);
    expect(canManageRole("stand_admin", "help_desk", secondaryRole)).toBe(false);
    expect(canManageRole("stand_admin", "stand_staff", secondaryRole)).toBe(true);
    expect(getManagedRoles("stand_admin", secondaryRole)).toEqual(["stand_staff"]);
  });

  it("lets a stand administrator with the secondary role sysadmin manage every role", () => {
    const actor = { role: "stand_admin", secondaryRole: "sysadmin", standId: STAND };

    expect(canManageRole("stand_admin", "sysadmin", "sysadmin")).toBe(true);
    expect(canManageAccount({ actor, target: { role: "kof_staff", standId: null } })).toBe(true);
    expect(canManageAccount({ actor, target: { role: "stand_staff", standId: "stand-2" } })).toBe(true);
  });

  it("lists the roles of both, without repeating one", () => {
    expect(getManagedRoles("stand_admin", "kof_admin")).toEqual(["stand_staff", "kof_staff"]);
    expect(getManagedRoles("stand_admin", null)).toEqual(["stand_staff"]);
    expect(getManagedRoles("stand_admin")).toEqual(["stand_staff"]);
    expect(getManagedRoles("kof_admin", "kof_admin")).toEqual(["kof_staff"]);
  });
});
