import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { Team } from "@features/teams/lib/types";

interface TeamFieldsProps {
  team?: Team;
}

/** Campos de un equipo (alta y edición). */
export function TeamFields({ team }: Readonly<TeamFieldsProps>) {
  const copy = ADMIN_COPY.teams;
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[560px]:grid-cols-1">
      <AdminTextField
        name="name"
        label={copy.name}
        placeholder={copy.namePlaceholder}
        defaultValue={team?.name}
        isRequired
      />
      <AdminTextField name="standCode" label={copy.stand} description={copy.standHint} defaultValue={team?.standCode} />
    </div>
  );
}
