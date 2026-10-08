/** Equipo de estudiantes del edificio que desarrolló videojuegos. */
export interface Team {
  id: number;
  slug: string;
  name: string;
  group: string | null;
  members: readonly string[];
  gameCount: number;
}
