/** @jest-environment node */
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { runAdminAction } from "@shared/lib/server/admin-action";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { ValidationError } from "@shared/lib/validation";

const options = { invalidateTags: ["games"], constraintMessages: { genre_slug_key: "Ese slug ya existe." } };

const createDeps = (isAdminValue = true) => {
  const updateTag = jest.fn();
  const refresh = jest.fn();

  return {
    deps: {
      isAdmin: async () => isAdminValue,
      cache: { updateTag, refresh },
    },
    updateTag,
    refresh,
  };
};

describe("runAdminAction", () => {
  it("rejects the request before running anything when it is not an admin", async () => {
    const { deps } = createDeps(false);
    const operation = jest.fn();

    await expect(runAdminAction(operation, options, deps)).resolves.toEqual({
      ok: false,
      error: "No tienes permiso para hacer cambios.",
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it("returns the data and invalidates the cache tags", async () => {
    const { deps, updateTag, refresh } = createDeps(true);

    await expect(runAdminAction(async () => ({ id: "1" }), options, deps)).resolves.toEqual({
      ok: true,
      data: { id: "1" },
    });
    expect(updateTag).toHaveBeenCalledWith("games");
    expect(refresh).toHaveBeenCalled();
  });

  it("returns the field errors of a validation error without invalidating", async () => {
    const { deps, updateTag } = createDeps(true);

    const result = await runAdminAction(
      async () => {
        throw new ValidationError({ name: "El nombre es obligatorio." });
      },
      options,
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "Revisa los campos marcados.",
      fieldErrors: { name: "El nombre es obligatorio." },
    });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("explains missing records, broken rules and violated constraints", async () => {
    const { deps } = createDeps(true);

    await expect(
      runAdminAction(
        async () => {
          throw new RecordNotFoundError("El género ya no existe.");
        },
        options,
        deps,
      ),
    ).resolves.toEqual({ ok: false, error: "El género ya no existe." });

    await expect(
      runAdminAction(
        async () => {
          throw new ActionRuleError("Te faltan 3 juegos.");
        },
        options,
        deps,
      ),
    ).resolves.toEqual({ ok: false, error: "Te faltan 3 juegos." });

    await expect(
      runAdminAction(
        async () => {
          throw Object.assign(new Error("duplicate"), { sqlState: "23505", constraint: "genre_slug_key" });
        },
        options,
        deps,
      ),
    ).resolves.toEqual({ ok: false, error: "Ese slug ya existe." });
  });

  it("rethrows unexpected errors", async () => {
    const { deps } = createDeps(true);

    await expect(
      runAdminAction(
        async () => {
          throw new Error("connection refused");
        },
        options,
        deps,
      ),
    ).rejects.toThrow("connection refused");
  });
});
