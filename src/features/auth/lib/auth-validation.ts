import type { LoginInput, RegisterTeamInput, StudentGroup } from "@features/auth/lib/types";
import { validate, type RawInput } from "@shared/lib/validation";

export const STUDENT_GROUPS: readonly StudentGroup[] = ["IDYGS101", "IDYGS102", "IDYGS103"] as const;

export const EMAIL_PATTERN = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/;

/** Valida los campos del formulario de inicio de sesión. */
export function parseLoginInput(raw: RawInput): LoginInput {
  return validate(raw, (field) => ({
    identifier: field.text("identifier", { label: "El usuario o correo", max: 120 }),
    password: field.text("password", { label: "La contraseña", max: 72 }),
  }));
}

/** Valida los campos del registro de equipo y líder. */
export function parseRegisterTeamInput(raw: RawInput): RegisterTeamInput {
  return validate(raw, (field) => {
    const email = field.text("email", {
      label: "El correo electrónico",
      max: 120,
      pattern: EMAIL_PATTERN,
      patternMessage: "Introduce un correo electrónico válido.",
    });

    const password = field.text("password", { label: "La contraseña", max: 72 });

    if (password.length < 8) {
      field.invalid("password", "La contraseña debe tener al menos 8 caracteres.");
    }

    return {
      teamName: field.text("teamName", { label: "El nombre del equipo", max: 80 }),
      fullName: field.text("fullName", { label: "El nombre completo del líder", max: 120 }),
      email,
      password,
      groupName: field.oneOf("groupName", STUDENT_GROUPS, "el grupo"),
    };
  });
}
