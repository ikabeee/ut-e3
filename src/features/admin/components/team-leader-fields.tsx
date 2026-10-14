import { AdminSelectField } from "@features/admin/components/admin-select-field";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { STUDENT_GROUPS } from "@features/teams/lib/types";

const GROUP_OPTIONS = STUDENT_GROUPS.map((group) => ({ value: group, label: group }));

/** Campos para que el administrador cree el usuario líder de un equipo. */
export function TeamLeaderFields() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
        <AdminTextField name="fullName" label="Nombre completo del líder" isRequired />
        <AdminTextField
          name="email"
          label="Correo institucional"
          type="email"
          placeholder="ej. alopez@ute3.edu.mx"
          isRequired
        />
        <AdminSelectField name="groupName" label="Grupo" options={GROUP_OPTIONS} isRequired />
      </div>
      <p className="m-0 text-xs text-muted">
        El líder recibirá un correo de confirmación para establecer su contraseña y activar su cuenta.
      </p>
    </div>
  );
}
