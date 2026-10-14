/** @jest-environment node */

import { createGameByLeaderAction } from "@features/teams/lib/team-portal-actions";
import { ActionRuleError } from "@shared/lib/action-rule-error";

describe("createGameByLeaderAction", () => {
  it("returns error if session is not authenticated as a team", async () => {
    const mockCreateGameByLeader = jest.fn();

    const deps = {
      getAuthSession: jest.fn().mockResolvedValue(null),
      createGameByLeader: mockCreateGameByLeader,
    };

    const result = await createGameByLeaderAction(
      {
        name: "Juego Test",
        description: "Descripción",
      },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "No tienes autorización para administrar este equipo.",
    });
    expect(mockCreateGameByLeader).not.toHaveBeenCalled();
  });

  it("returns error if session has no teamId", async () => {
    const deps = {
      getAuthSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-1",
        email: "leader@ut.edu",
      }),
    };

    const result = await createGameByLeaderAction(
      {
        name: "Juego Test",
        description: "Descripción",
      },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "No tienes autorización para administrar este equipo.",
    });
  });

  it("returns field errors when input is invalid", async () => {
    const deps = {
      getAuthSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-1",
        email: "leader@ut.edu",
        teamId: "team-123",
      }),
    };

    const result = await createGameByLeaderAction(
      {
        name: "",
        description: "",
      },
      deps,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toBe("El nombre del juego es obligatorio.");
      expect(result.fieldErrors?.description).toBe("La descripción del juego es obligatorio.");
    }
  });

  it("creates game and returns ok when team is authenticated and input is valid", async () => {
    const mockCreateGameByLeader = jest.fn().mockResolvedValue(undefined);

    const deps = {
      getAuthSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-1",
        email: "leader@ut.edu",
        teamId: "team-123",
      }),
      createGameByLeader: mockCreateGameByLeader,
      cache: { updateTag: jest.fn(), refresh: jest.fn() },
    };

    const result = await createGameByLeaderAction(
      {
        name: "Laberinto E3",
        description: "Juego de laberintos en 2D.",
        players: "2",
        itchioUrl: "https://studio.itch.io/laberinto",
      },
      deps,
    );

    expect(result).toEqual({
      ok: true,
      data: undefined,
    });
    expect(mockCreateGameByLeader).toHaveBeenCalledWith("team-123", {
      name: "Laberinto E3",
      description: "Juego de laberintos en 2D.",
      players: 2,
      itchioUrl: "https://studio.itch.io/laberinto",
    });
  });

  it("returns action error when createGameByLeader throws an ActionRuleError", async () => {
    const mockCreateGameByLeader = jest
      .fn()
      .mockRejectedValue(new ActionRuleError("Tu equipo ya tiene un videojuego registrado."));

    const deps = {
      getAuthSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-1",
        email: "leader@ut.edu",
        teamId: "team-123",
      }),
      createGameByLeader: mockCreateGameByLeader,
    };

    const result = await createGameByLeaderAction(
      {
        name: "Segundo Juego",
        description: "Descripción de intento duplicado.",
      },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "Tu equipo ya tiene un videojuego registrado.",
    });
  });
});
