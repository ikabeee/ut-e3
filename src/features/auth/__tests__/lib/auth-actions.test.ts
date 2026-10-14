/** @jest-environment node */

import { confirmEmailAndSetPasswordAction, loginAction } from "@features/auth/lib/auth-actions";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";

describe("loginAction", () => {
  it("returns error result on invalid credentials without throwing an unhandled exception", async () => {
    const deps = {
      authenticateUser: jest.fn().mockResolvedValue({ success: false }),
      saveAuthSession: jest.fn(),
    };

    const result = await loginAction({ identifier: "admin", password: "wrong-password" }, deps);

    expect(result).toEqual({
      ok: false,
      error: AUTH_COPY.login.errors.invalidCredentials,
    });
  });

  it("returns error result on unconfirmed account without throwing", async () => {
    const deps = {
      authenticateUser: jest.fn().mockResolvedValue({ success: false, unconfirmed: true }),
      saveAuthSession: jest.fn(),
    };

    const result = await loginAction({ identifier: "leader@ute3.edu.mx", password: "some-password" }, deps);

    expect(result).toEqual({
      ok: false,
      error: AUTH_COPY.login.errors.unconfirmedEmail,
    });
  });

  it("returns success and redirects admin to /admin", async () => {
    const saveAuthSessionMock = jest.fn().mockResolvedValue(undefined);

    const deps = {
      authenticateUser: jest.fn().mockResolvedValue({
        success: true,
        session: { role: "admin", userId: "admin-1", email: "admin@ute3.edu.mx", username: "admin" },
      }),
      saveAuthSession: saveAuthSessionMock,
    };

    const result = await loginAction({ identifier: "admin", password: "valid-password" }, deps);

    expect(result).toEqual({
      ok: true,
      data: { redirectTo: "/admin" },
    });
    expect(saveAuthSessionMock).toHaveBeenCalled();
  });

  it("returns success and redirects team to /team", async () => {
    const saveAuthSessionMock = jest.fn().mockResolvedValue(undefined);

    const deps = {
      authenticateUser: jest.fn().mockResolvedValue({
        success: true,
        session: {
          role: "team",
          userId: "member-1",
          email: "member@ute3.edu.mx",
          teamId: "team-1",
          teamName: "Equipo 1",
          standCode: "E01",
        },
      }),
      saveAuthSession: saveAuthSessionMock,
    };

    const result = await loginAction({ identifier: "member@ute3.edu.mx", password: "valid-password" }, deps);

    expect(result).toEqual({
      ok: true,
      data: { redirectTo: "/team" },
    });
  });
});

describe("confirmEmailAndSetPasswordAction", () => {
  it("confirms email and sets password successfully", async () => {
    const confirmMock = jest.fn().mockResolvedValue(true);

    const result = await confirmEmailAndSetPasswordAction(
      {
        token: "1234567890abcdef1234567890abcdef",
        password: "new-secure-password",
        confirmPassword: "new-secure-password",
      },
      { confirmEmailAndSetPassword: confirmMock },
    );

    expect(result).toEqual({
      ok: true,
      data: { confirmed: true },
    });
    expect(confirmMock).toHaveBeenCalledWith("1234567890abcdef1234567890abcdef", "new-secure-password");
  });

  it("returns error result when token is invalid or expired", async () => {
    const confirmMock = jest.fn().mockResolvedValue(false);

    const result = await confirmEmailAndSetPasswordAction(
      {
        token: "1234567890abcdef1234567890abcdef",
        password: "new-secure-password",
        confirmPassword: "new-secure-password",
      },
      { confirmEmailAndSetPassword: confirmMock },
    );

    expect(result).toEqual({
      ok: false,
      error: AUTH_COPY.confirmEmail.errorMessage,
    });
  });
});
