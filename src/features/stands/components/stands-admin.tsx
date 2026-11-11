import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import { StandAdminForm } from "@features/stands/components/stand-admin-form";
import { AdminFields, StandFields } from "@features/stands/components/stand-fields";
import { StandAdminRow, type StandAdminActions } from "@features/stands/components/stand-admin-row";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { AdminStand } from "@features/stands/lib/types";

export interface StandsAdminActions extends StandAdminActions {
  create: ManagementAction;
}

interface StandsAdminProps {
  stands: readonly AdminStand[];
  actions: StandsAdminActions;
}

const COPY = STANDS_COPY.admin;

const HEADING_ID = "stands-admin";

/** The stands of the event and their accounts: the sysadmin creates each stand with its administrator (RF-39). */
export function StandsAdmin({ stands, actions }: Readonly<StandsAdminProps>) {
  return (
    <section aria-labelledby={HEADING_ID} className="grid gap-6">
      <h2 id={HEADING_ID} className="type-section">
        {COPY.heading}
      </h2>
      <details className="border border-border p-4">
        <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.createHeading}</summary>
        <div className="pt-4">
          <StandAdminForm action={actions.create} submitLabel={COPY.createSubmit} clearsWhenDone>
            <StandFields />
            <AdminFields />
          </StandAdminForm>
        </div>
      </details>
      <StandList stands={stands} actions={actions} />
    </section>
  );
}

function StandList({ stands, actions }: Readonly<StandsAdminProps>) {
  if (stands.length === 0) return <p className="type-mono text-muted">{COPY.empty}</p>;

  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {stands.map((stand) => (
        <StandAdminRow key={stand.id} stand={stand} actions={actions} />
      ))}
    </ul>
  );
}
