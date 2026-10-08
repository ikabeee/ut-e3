import type { Team } from "./team";

export interface TeamRepository {
  listAll(): Promise<Team[]>;
}
