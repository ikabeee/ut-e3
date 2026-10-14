import { parseTeamInput, parseTeamMemberInput } from "@features/teams/lib/team-validation";
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
