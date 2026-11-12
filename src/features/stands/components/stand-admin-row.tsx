import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import { ManagedAccountList } from "@features/accounts/components/managed-account-list";
import { StandAdminForm } from "@features/stands/components/stand-admin-form";
import { AdminFields, StandFields } from "@features/stands/components/stand-fields";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { AdminStand } from "@features/stands/lib/types";

export interface StandAdminActions {
  update: ManagementAction;
  inviteAdmin: ManagementAction;
  resend: ManagementAction;
  disable: ManagementAction;
  reactivate: ManagementAction;
}

interface StandAdminRowProps {
  stand: AdminStand;
  actions: StandAdminActions;
}

const COPY = STANDS_COPY.admin;

/** One stand: its full code, its game, how many staff accounts it uses and the controls of the sysadmin over it. */
export function StandAdminRow({ stand, actions }: Readonly<StandAdminRowProps>) {
  const hasActiveAdmin = stand.admins.some((admin) => admin.status !== "disabled");

  return (
    <li className="grid gap-4 border border-border p-4">
      <div className="grid gap-1">
        <p className="font-bold">{stand.code}</p>
        <p className="type-tiny text-muted">{COPY.gameOf(stand.gameName)}</p>
        <p className="type-tiny text-muted">{COPY.staffCount(stand.activeStaff)}</p>
      </div>
      <details>
        <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.editHeading}</summary>
        <div className="pt-4">
          <StandAdminForm action={actions.update} submitLabel={COPY.editSubmit} clearsWhenDone={false}>
            <input type="hidden" name="standId" value={stand.id} />
            <StandFields stand={stand} />
          </StandAdminForm>
        </div>
      </details>
      <h3 className="type-mono">{COPY.adminsHeading}</h3>
      <ManagedAccountList
        accounts={stand.admins}
        resendAction={actions.resend}
        disableAction={actions.disable}
        reactivateAction={actions.reactivate}
      />
      {!hasActiveAdmin && <InviteAdmin standId={stand.id} action={actions.inviteAdmin} />}
    </li>
  );
}

function InviteAdmin({ standId, action }: Readonly<{ standId: string; action: ManagementAction }>) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted">{COPY.noAdmin}</p>
      <StandAdminForm action={action} submitLabel={COPY.inviteSubmit} clearsWhenDone>
        <input type="hidden" name="standId" value={standId} />
        <AdminFields />
      </StandAdminForm>
    </div>
  );
}
