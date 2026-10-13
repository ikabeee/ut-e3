import { AdminCheckbox } from "@features/admin/components/admin-checkbox";
import { AdminSelectField } from "@features/admin/components/admin-select-field";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { STUDENT_GROUPS } from "@features/teams/lib/types";

const GROUP_OPTIONS = STUDENT_GROUPS.map((group) => ({ value: group, label: group }));

interface TeamMemberFieldsProps {
  /** Posición sugerida para el nuevo integrante (al final de la lista). */
  nextSortOrder: number;
}

/** Campos de un integrante nuevo. */
export function TeamMemberFields({ nextSortOrder }: Readonly<TeamMemberFieldsProps>) {
  const copy = ADMIN_COPY.teams;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
        <AdminTextField name="fullName" label={copy.memberName} isRequired />
        <AdminSelectField name="groupName" label={copy.group} options={GROUP_OPTIONS} isRequired />
        <AdminTextField name="sortOrder" label={copy.sortOrder} type="number" defaultValue={nextSortOrder} />
      </div>
      <AdminCheckbox name="isLeader" label={copy.isLeader} />
    </div>
  );
}
