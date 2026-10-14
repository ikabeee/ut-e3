import {
  parseAddMemberByLeaderInput,
  parseCreateTeamInput,
  parseCreateTeamLeaderInput,
  parseTeamInput,
  parseTeamMemberInput,
  parseUpdateGameByLeaderInput,
} from "@features/teams/lib/team-validation";
import { ValidationError } from "@shared/lib/validation";

function fieldErrors(run: () => void) {
  try {
    run();
  } catch (error) {
    if (error instanceof ValidationError) return error.fieldErrors;
    throw error;
  }

  return {};
}

describe("parseTeamInput", () => {
  it("accepts a team with or without stand", () => {
    expect(parseTeamInput({ name: "Equipo Grava", standCode: "A1" })).toEqual({
      name: "Equipo Grava",
      standCode: "A1",
    });
    expect(parseTeamInput({ name: "Equipo Grava", standCode: "" })).toEqual({ name: "Equipo Grava", standCode: null });
  });

  it("only accepts the stands of the floor plan", () => {
    expect(fieldErrors(() => parseTeamInput({ name: "Equipo Grava", standCode: "C1" }))).toEqual({
      standCode: "El stand debe ser A1-A9 o B1-B9.",
    });
  });
});

describe("parseCreateTeamInput", () => {
  it("accepts a team without leader fields", () => {
    expect(parseCreateTeamInput({ name: "Equipo Grava", standCode: "A1" })).toEqual({
      name: "Equipo Grava",
      standCode: "A1",
      leader: null,
    });
  });

  it("accepts a team with initial leader fields", () => {
    expect(
      parseCreateTeamInput({
        name: "Equipo Grava",
        standCode: "A1",
        leaderFullName: "Ana López",
        leaderEmail: "alopez@ute3.edu.mx",
        leaderGroupName: "IDYGS102",
      }),
    ).toEqual({
      name: "Equipo Grava",
      standCode: "A1",
      leader: {
        fullName: "Ana López",
        email: "alopez@ute3.edu.mx",
        groupName: "IDYGS102",
      },
    });
  });

  it("validates leader fields if any is provided", () => {
    expect(
      fieldErrors(() =>
        parseCreateTeamInput({
          name: "Equipo Grava",
          standCode: "A1",
          leaderFullName: "Ana López",
          leaderEmail: "invalid-email",
          leaderGroupName: "IDYGS102",
        }),
      ),
    ).toEqual({
      email: "Introduce un correo electrónico válido.",
    });
  });
});

describe("parseTeamMemberInput", () => {
  it("accepts a member of one of the groups", () => {
    expect(parseTeamMemberInput({ fullName: "Ana López", groupName: "IDYGS102", isLeader: "true" })).toEqual({
      fullName: "Ana López",
      groupName: "IDYGS102",
      isLeader: true,
      sortOrder: 0,
    });
  });

  it("rejects groups that do not exist", () => {
    expect(fieldErrors(() => parseTeamMemberInput({ fullName: "Ana López", groupName: "IDYGS999" }))).toEqual({
      groupName: "Elige un valor válido para el grupo.",
    });
  });
});

describe("parseCreateTeamLeaderInput", () => {
  it("accepts valid leader user input", () => {
    expect(
      parseCreateTeamLeaderInput({
        fullName: "Ana López",
        email: "alopez@ute3.edu.mx",
        groupName: "IDYGS102",
      }),
    ).toEqual({
      fullName: "Ana López",
      email: "alopez@ute3.edu.mx",
      groupName: "IDYGS102",
    });
  });

  it("rejects invalid email", () => {
    expect(
      fieldErrors(() =>
        parseCreateTeamLeaderInput({
          fullName: "Ana López",
          email: "invalid-email",
          groupName: "IDYGS102",
        }),
      ),
    ).toEqual({
      email: "Introduce un correo electrónico válido.",
    });
  });
});

describe("parseAddMemberByLeaderInput", () => {
  it("validates member name and group", () => {
    expect(
      parseAddMemberByLeaderInput({
        fullName: "Carlos Mendoza",
        groupName: "IDYGS101",
      }),
    ).toEqual({
      fullName: "Carlos Mendoza",
      groupName: "IDYGS101",
    });
  });
});

describe("parseUpdateGameByLeaderInput", () => {
  it("validates game description and optional itchio url", () => {
    expect(
      parseUpdateGameByLeaderInput({
        description: "Un juego de aventura espacial.",
        itchioUrl: "https://studio.itch.io/space-adventure",
      }),
    ).toEqual({
      description: "Un juego de aventura espacial.",
      itchioUrl: "https://studio.itch.io/space-adventure",
    });
  });
});
