/** Grupos de los integrantes (enum `StudentGroup` del contrato de Prisma). */
export const STUDENT_GROUPS = ["IDYGS101", "IDYGS102", "IDYGS103"] as const;

export type StudentGroup = (typeof STUDENT_GROUPS)[number];

/** Códigos de los stands de equipo en el croquis: A1-A9 y B1-B9. */
export const STAND_CODE_PATTERN = /^[AB][1-9]$/;

export interface TeamMember {
  id: string;
  teamId: string;
  fullName: string;
  email: string;
  groupName: StudentGroup;
  isLeader: boolean;
  sortOrder: number;
  isConfirmed: boolean;
}

/** Equipo tal como lo ve el panel de administración. */
export interface Team {
  id: string;
  name: string;
  /** Código del stand; `null` mientras no se asigna. */
  standCode: string | null;
  members: TeamMember[];
  /** Slug del juego del equipo, si ya lo registró. */
  gameSlug: string | null;
}

export interface TeamInput {
  name: string;
  standCode: string | null;
}

export interface TeamMemberInput {
  fullName: string;
  groupName: StudentGroup;
  isLeader: boolean;
  sortOrder: number;
  email?: string;
  passwordHash?: string;
}

export interface CreateTeamLeaderInput {
  fullName: string;
  email: string;
  groupName: StudentGroup;
}

export interface CreateTeamInput {
  name: string;
  standCode: string | null;
  leader?: CreateTeamLeaderInput | null;
}

export interface AddMemberByLeaderInput {
  fullName: string;
  groupName: StudentGroup;
}

export interface CreateGameByLeaderInput {
  name: string;
  description: string;
  genreId?: string | null;
  itchioUrl?: string | null;
  players?: number;
}

export interface UpdateGameByLeaderInput {
  description: string;
  itchioUrl?: string | null;
}

/**
 * Equipo recién creado (o con su llave renovada). `scannerKey` es la llave del escáner del
 * stand: sólo se muestra esta vez, la base guarda su hash.
 */
export interface TeamWithScannerKey {
  team: Team;
  scannerKey: string;
}

export interface TeamPortalMember {
  id: string;
  fullName: string;
  email: string;
  groupName: StudentGroup;
  isLeader: boolean;
}

export interface TeamPortalGame {
  id: string;
  name: string;
  slug: string;
  description?: string;
  itchioUrl?: string | null;
}

export interface TeamPortalData {
  id: string;
  name: string;
  standCode: string | null;
  scannerKey: string | null;
  game: TeamPortalGame | null;
  members: TeamPortalMember[];
  totalCheckIns: number;
  recentCheckIns: number;
}

export interface TeamScanResult {
  status: "created" | "duplicate" | "unknown";
  gamertag?: string;
  gameName?: string;
}
