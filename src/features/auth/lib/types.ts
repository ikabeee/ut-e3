export type StudentGroup = "IDYGS101" | "IDYGS102" | "IDYGS103";

export type AuthRole = "admin" | "team";

/** Sesión de usuario autenticado en la plataforma. */
export interface AuthSession {
  role: AuthRole;
  userId: string;
  email: string;
  username?: string;
  teamId?: string;
  teamName?: string;
  standCode?: string | null;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterTeamInput {
  teamName: string;
  fullName: string;
  email: string;
  groupName: StudentGroup;
  password?: string;
}

export interface ConfirmPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}
