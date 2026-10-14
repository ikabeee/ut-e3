import { AdminSelectField } from "@features/admin/components/admin-select-field";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { STUDENT_GROUPS } from "@features/teams/lib/types";

const GROUP_OPTIONS = STUDENT_GROUPS.map((group) => ({ value: group, label: group }));

/** Campos para que el administrador cree el usuario líder de un equipo. */
export function TeamLeaderFields() {
  const copy = ADMIN_COPY.teams.leaderSection;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
        <AdminTextField name="fullName" label={copy.fullName} isRequired />
        <AdminTextField name="email" label={copy.email} type="email" placeholder={copy.emailPlaceholder} isRequired />
        <AdminSelectField name="groupName" label={copy.group} options={GROUP_OPTIONS} isRequired />
      </div>
      <p className="m-0 text-xs text-muted">{copy.leaderCreatedNotice}</p>
    </div>
  );
}
