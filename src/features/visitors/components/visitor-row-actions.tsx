import { VisitorEditForm } from "@features/visitors/components/visitor-edit-form";
import { VisitorQuickAction, type VisitorAdminAction } from "@features/visitors/components/visitor-quick-action";
import type { AdminVisitorRow } from "@features/visitors/lib/types";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";

export interface VisitorAdminActions {
  resend: VisitorAdminAction;
  recovery: VisitorAdminAction;
  update: VisitorAdminAction;
  unexclude: VisitorAdminAction;
}

const COPY = VISITORS_ADMIN_COPY.actions;

/** What the sysadmin can do with one passport, folded away until asked for. */
export function VisitorRowActions({
  visitor,
  actions,
}: Readonly<{ visitor: AdminVisitorRow; actions: VisitorAdminActions }>) {
  return (
    <details className="border border-border p-3">
      <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.open(visitor.gamertag)}</summary>
      <div className="grid gap-6 pt-4">
        <VisitorQuickAction action={actions.resend} visitorId={visitor.id} label={COPY.resend} hint={COPY.resendHint} />
        <VisitorQuickAction
          action={actions.recovery}
          visitorId={visitor.id}
          label={COPY.recovery}
          hint={COPY.recoveryHint}
        />
        {visitor.isExcluded ? (
          <VisitorQuickAction
            action={actions.unexclude}
            visitorId={visitor.id}
            label={COPY.unexclude}
            hint={COPY.unexcludeHint}
          />
        ) : null}
        <div className="grid gap-2">
          <h4 className="type-tiny">{COPY.edit.heading}</h4>
          <VisitorEditForm visitor={visitor} action={actions.update} />
        </div>
      </div>
    </details>
  );
}
