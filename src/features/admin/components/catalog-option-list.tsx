import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminDisclosure } from "@features/admin/components/admin-disclosure";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { CatalogOption } from "@features/games/lib/types";
import type { ActionResult, FormAction } from "@shared/lib/action-result";
import type { RawInput } from "@shared/lib/validation";

interface CatalogOptionListProps {
  title: string;
  options: readonly CatalogOption[];
  createLabel: string;
  createAction: FormAction<unknown>;
  updateAction: (id: string, input: RawInput) => Promise<ActionResult<unknown>>;
  deleteAction: (id: string) => Promise<ActionResult<unknown>>;
}

function CatalogOptionFields({ option }: Readonly<{ option?: CatalogOption }>) {
  const copy = ADMIN_COPY.catalog;

  return (
    <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
      <AdminTextField name="name" label={copy.name} defaultValue={option?.name} isRequired />
      <AdminTextField name="slug" label={copy.slug} defaultValue={option?.slug} isRequired />
    </div>
  );
}

/** Géneros o plataformas: alta, edición y borrado. */
export function CatalogOptionList({
  title,
  options,
  createLabel,
  createAction,
  updateAction,
  deleteAction,
}: Readonly<CatalogOptionListProps>) {
  return (
    <AdminPanel title={title}>
      {options.length === 0 ? <p className="m-0 text-sm text-muted">{ADMIN_COPY.catalog.empty}</p> : null}
      <ul className="m-0 flex list-none flex-col p-0">
        {options.map((option) => (
          <li key={option.id} className="flex flex-col gap-2 border-t border-border pt-3 pb-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {option.name} <span className="type-tiny text-muted">· {option.slug}</span>
              </span>
              <AdminActionButton
                action={deleteAction.bind(null, option.id)}
                label={ADMIN_COPY.common.delete}
                confirmLabel={ADMIN_COPY.common.confirmDelete}
                variant="tertiary"
              />
            </div>
            <AdminDisclosure label={ADMIN_COPY.common.edit}>
              <AdminActionForm
                action={updateAction.bind(null, option.id)}
                submitLabel={ADMIN_COPY.common.save}
                successMessage={ADMIN_COPY.common.saved}
              >
                <CatalogOptionFields option={option} />
              </AdminActionForm>
            </AdminDisclosure>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-4">
        <AdminActionForm
          action={createAction}
          submitLabel={createLabel}
          successMessage={ADMIN_COPY.catalog.created}
          resetOnSuccess
        >
          <CatalogOptionFields />
        </AdminActionForm>
      </div>
    </AdminPanel>
  );
}
