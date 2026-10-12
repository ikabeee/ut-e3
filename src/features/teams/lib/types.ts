/** Grupos de los integrantes (enum `StudentGroup` del contrato de Prisma). */
export const STUDENT_GROUPS = ["IDYGS101", "IDYGS102", "IDYGS103"] as const;

export type StudentGroup = (typeof STUDENT_GROUPS)[number];

/** Códigos de los stands de equipo en el croquis: A1-A9 y B1-B9. */
export const STAND_CODE_PATTERN = /^[AB][1-9]$/;

export interface TeamMember {
  id: string;
  teamId: string;
  fullName: string;
  groupName: StudentGroup;
  isLeader: boolean;
  sortOrder: number;
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
}

/**
 * Equipo recién creado (o con su llave renovada). `scannerKey` es la llave del escáner del
 * stand: sólo se muestra esta vez, la base guarda su hash.
 */
export interface TeamWithScannerKey {
  team: Team;
  scannerKey: string;
}
