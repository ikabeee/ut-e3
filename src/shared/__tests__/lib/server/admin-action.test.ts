/** @jest-environment node */
import { updateTag } from "next/cache";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { runAdminAction } from "@shared/lib/server/admin-action";
import { isAdminRequest } from "@shared/lib/server/admin-auth";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { ValidationError } from "@shared/lib/validation";

jest.mock("next/cache", () => ({ updateTag: jest.fn() }));
jest.mock("@shared/lib/server/admin-auth", () => ({
  ...jest.requireActual("@shared/lib/server/admin-auth"),
  isAdminRequest: jest.fn(),
}));

const options = { invalidateTags: ["games"], constraintMessages: { genre_slug_key: "Ese slug ya existe." } };

describe("runAdminAction", () => {
  beforeEach(() => {
    jest.mocked(isAdminRequest).mockResolvedValue(true);
    jest.mocked(updateTag).mockClear();
  });

  it("rejects the request before running anything when it is not an admin", async () => {
    jest.mocked(isAdminRequest).mockResolvedValue(false);
    const operation = jest.fn();

    await expect(runAdminAction(operation, options)).resolves.toEqual({
      ok: false,
      error: "No tienes permiso para hacer cambios.",
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it("returns the data and invalidates the cache tags", async () => {
    await expect(runAdminAction(async () => ({ id: "1" }), options)).resolves.toEqual({ ok: true, data: { id: "1" } });
    expect(updateTag).toHaveBeenCalledWith("games");
  });

  it("returns the field errors of a validation error without invalidating", async () => {
    const result = await runAdminAction(async () => {
      throw new ValidationError({ name: "El nombre es obligatorio." });
    }, options);

    expect(result).toEqual({
      ok: false,
      error: "Revisa los campos marcados.",
      fieldErrors: { name: "El nombre es obligatorio." },
    });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("explains missing records, broken rules and violated constraints", async () => {
    await expect(
      runAdminAction(async () => {
        throw new RecordNotFoundError("El género ya no existe.");
      }, options),
    ).resolves.toEqual({ ok: false, error: "El género ya no existe." });

    await expect(
      runAdminAction(async () => {
        throw new ActionRuleError("Te faltan 3 juegos.");
      }, options),
    ).resolves.toEqual({ ok: false, error: "Te faltan 3 juegos." });

    await expect(
      runAdminAction(async () => {
        throw Object.assign(new Error("duplicate"), { sqlState: "23505", constraint: "genre_slug_key" });
      }, options),
    ).resolves.toEqual({ ok: false, error: "Ese slug ya existe." });
  });

  it("rethrows unexpected errors", async () => {
    await expect(
      runAdminAction(async () => {
        throw new Error("connection refused");
      }, options),
    ).rejects.toThrow("connection refused");
  });
});
