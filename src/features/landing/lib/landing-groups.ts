/** Grupos que participan en el showcase. */
export const STUDENT_GROUPS = ["IDYGS101", "IDYGS102", "IDYGS103"] as const;

export type StudentGroup = (typeof STUDENT_GROUPS)[number];

/** "IDYGS101" -> "IDYGS 101". */
export function formatGroupLabel(group: StudentGroup) {
  return group.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
}

export function getGroupLabels() {
  return STUDENT_GROUPS.map(formatGroupLabel);
}
