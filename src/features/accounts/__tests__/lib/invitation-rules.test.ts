import {
  canManageRole,
  getManagedRoles,
  INVITATION_TTL_MS,
  isInvitationExpired,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "@features/accounts/lib/invitation-rules";

describe("canManageRole (S7)", () => {
  it.each(["kof_admin", "raffle_admin", "help_desk"])("lets the sysadmin manage a %s", (role) => {
    expect(canManageRole("sysadmin", role)).toBe(true);
  });

  it.each(["sysadmin", "kof_staff", "stand_admin", "stand_staff", "other"])(
    "does not let the sysadmin manage a %s through this flow",
    (role) => {
      expect(canManageRole("sysadmin", role)).toBe(false);
    },
  );

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
