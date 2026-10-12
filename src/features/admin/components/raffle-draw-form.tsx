import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { drawRaffleWinnersAction } from "@features/visitors/lib/visitors-actions";

/** Sorteo de ganadores entre los boletos que todavía no han ganado. */
export function RaffleDrawForm() {
  const copy = ADMIN_COPY.raffle;
  return (
    <AdminActionForm action={drawRaffleWinnersAction} submitLabel={copy.draw} successMessage={copy.drawn}>
      <div className="max-w-60">
        <AdminTextField name="winners" label={copy.winnersCount} type="number" defaultValue={1} isRequired />
      </div>
    </AdminActionForm>
  );
}
