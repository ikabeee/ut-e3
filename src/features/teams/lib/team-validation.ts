import {
  STAND_CODE_PATTERN,
  STUDENT_GROUPS,
  type AddMemberByLeaderInput,
  type CreateTeamInput,
  type CreateTeamLeaderInput,
  type TeamInput,
  type TeamMemberInput,
  type UpdateGameByLeaderInput,
} from "@features/teams/lib/types";
import { isString, validate, type RawInput } from "@shared/lib/validation";

const EMAIL_PATTERN = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/;

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

/** Valida los datos para que el sysadmin cree el usuario líder de un equipo (sin contraseña inicial). */
export function parseCreateTeamLeaderInput(raw: RawInput): CreateTeamLeaderInput {
  return validate(raw, (field) => {
    const email = field.text("email", {
      label: "El correo electrónico institucional",
      max: 120,
      pattern: EMAIL_PATTERN,
      patternMessage: "Introduce un correo electrónico válido.",
    });

    return {
      fullName: field.text("fullName", { label: "El nombre completo del líder", max: 120 }),
      email,
      groupName: field.oneOf("groupName", STUDENT_GROUPS, "el grupo"),
    };
  });
}

/** Valida los datos para crear un equipo, opcionalmente con su usuario líder inicial. */
export function parseCreateTeamInput(raw: RawInput): CreateTeamInput {
  const base = parseTeamInput(raw);
  const leaderFullName = raw["leaderFullName"] ?? raw["fullName"];
  const leaderEmail = raw["leaderEmail"] ?? raw["email"];
  const leaderGroupName = raw["leaderGroupName"] ?? raw["groupName"];

  const hasAnyLeaderField = Boolean(
    (isString(leaderFullName) && leaderFullName.trim()) ||
    (isString(leaderEmail) && leaderEmail.trim()) ||
    (isString(leaderGroupName) && leaderGroupName.trim()),
  );

  if (!hasAnyLeaderField) {
    return { ...base, leader: null };
  }

  const leader = parseCreateTeamLeaderInput({
    fullName: leaderFullName,
    email: leaderEmail,
    groupName: leaderGroupName,
  });

  return { ...base, leader };
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

/** Valida los datos para que un líder agregue un integrante a su equipo. */
export function parseAddMemberByLeaderInput(raw: RawInput): AddMemberByLeaderInput {
  return validate(raw, (field) => ({
    fullName: field.text("fullName", { label: "El nombre completo del integrante", max: 120 }),
    groupName: field.oneOf("groupName", STUDENT_GROUPS, "el grupo"),
  }));
}

/** Valida los datos para que el líder edite la información de su juego. */
export function parseUpdateGameByLeaderInput(raw: RawInput): UpdateGameByLeaderInput {
  return validate(raw, (field) => ({
    description: field.text("description", { label: "La descripción del juego", max: 300 }),
    itchioUrl: field.optionalText("itchioUrl", { label: "El enlace de itch.io", max: 255 }) ?? null,
  }));
}
