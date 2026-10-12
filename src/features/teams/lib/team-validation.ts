import { STAND_CODE_PATTERN, STUDENT_GROUPS, type TeamInput, type TeamMemberInput } from "@features/teams/lib/types";
import { validate, type RawInput } from "@shared/lib/validation";

/** Valida los datos de un equipo (mismas reglas que `contract.prisma`). */
export function parseTeamInput(raw: RawInput): TeamInput {
  return validate(raw, (field) => ({
    name: field.text("name", { label: "El nombre del equipo", max: 80 }),
    standCode:
      field.optionalText("standCode", {
        label: "El stand",
        max: 2,
        pattern: STAND_CODE_PATTERN,
        patternMessage: "El stand debe ser A1-A9 o B1-B9.",
      }) ?? null,
  }));
}

/** Valida los datos de un integrante. */
export function parseTeamMemberInput(raw: RawInput): TeamMemberInput {
  return validate(raw, (field) => ({
    fullName: field.text("fullName", { label: "El nombre completo", max: 120 }),
    groupName: field.oneOf("groupName", STUDENT_GROUPS, "el grupo"),
    isLeader: field.boolean("isLeader"),
    sortOrder: field.integer("sortOrder", { label: "El orden", min: 0, max: 99, fallback: 0 }),
  }));
}
