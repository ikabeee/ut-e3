import type { StandAccountRow } from "@features/accounts/lib/types";
import type { StandFields } from "@features/stands/lib/stand-input";

/** A stand as the sysadmin sees it (RF-38): its data, its game, its administrators and how many staff accounts it uses. */
export interface AdminStand extends StandFields {
  id: string;
  /** The full code, like `ZA-S1-E6-101`. */
  code: string;
  gameName: string | null;
  admins: StandAccountRow[];
  /** Invited and active staff accounts, which are the ones that count against the limit of 3. */
  activeStaff: number;
}
