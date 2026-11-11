"use client";

import { ConfirmActionForm } from "@shared/components/confirm-action-form";
import type { ScheduleAction } from "@features/schedule/components/schedule-item-form";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";

interface ScheduleItemDeleteProps {
  itemId: string;
  itemTitle: string;
  action: ScheduleAction;
}

const COPY = SCHEDULE_COPY.admin;

export function ScheduleItemDelete({ itemId, itemTitle, action }: Readonly<ScheduleItemDeleteProps>) {
  return (
    <ConfirmActionForm
      action={action}
      field={{ name: "id", value: itemId }}
      labels={{
        trigger: COPY.delete,
        prompt: COPY.confirmDelete(itemTitle),
        confirm: COPY.confirmDeleteAction,
        cancel: COPY.cancel,
      }}
    />
  );
}
