"use client";

import { Button } from "@heroui/react";
import { useActionState, useState } from "react";
import type { ScheduleAction } from "@features/schedule/components/schedule-item-form";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";

interface ScheduleItemDeleteProps {
  itemId: string;
  itemTitle: string;
  action: ScheduleAction;
}

const COPY = SCHEDULE_COPY.admin;

// Deleting cannot be undone, so the first press only asks; the item goes away on the second.
export function ScheduleItemDelete({ itemId, itemTitle, action }: Readonly<ScheduleItemDeleteProps>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  if (!isConfirming) {
    return (
      <Button variant="tertiary" className="min-h-11" onPress={() => setIsConfirming(true)}>
        {COPY.delete}
      </Button>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={itemId} />
      <p className="text-sm">{COPY.confirmDelete(itemTitle)}</p>
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="danger" className="min-h-11" isPending={isPending}>
          {COPY.confirmDeleteAction}
        </Button>
        <Button variant="tertiary" className="min-h-11" onPress={() => setIsConfirming(false)}>
          {COPY.cancel}
        </Button>
      </div>
    </form>
  );
}
