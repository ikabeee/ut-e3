import { STUDENT_GROUPS, type StudentGroup } from "@features/teams/lib/types";

/** "IDYGS101" -> "IDYGS 101". */
export function formatGroupLabel(group: StudentGroup) {
  return group.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
}

export function getGroupLabels() {
  return STUDENT_GROUPS.map(formatGroupLabel);
}
