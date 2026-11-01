"use client";

import { Button, Form } from "@heroui/react";
import { KioskRatingField } from "@features/stands/components/kiosk-rating-field";
import type { VisitActionState } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { RATING_FIELDS } from "@features/stands/lib/survey-input";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface KioskSurveyStepProps {
  /** The PIN that passed the first screen; it travels with the answers and the server checks it again. */
  pin: string;
  state: VisitActionState | null;
  action: (form: FormData) => void;
  isPending: boolean;
  onCancel: () => void;
}

const COPY = STANDS_COPY.kiosk.survey;

/** The second screen: the three ratings of the visit (RF-26). Sending them records the visit. */
export function KioskSurveyStep({ pin, state, action, isPending, onCancel }: Readonly<KioskSurveyStepProps>) {
  const handleSubmit = useSubmitKeepingValues(action);

  return (
    <Form action={action} onSubmit={handleSubmit} className="grid w-full max-w-xl gap-6">
      <div>
        <h2 className="type-section">{COPY.heading}</h2>
        <p className="mt-2 text-sm text-muted">{COPY.hint}</p>
      </div>
      <input type="hidden" name="pin" value={pin} />
      {RATING_FIELDS.map((field) => (
        <KioskRatingField key={field} name={field} legend={COPY.fields[field]} />
      ))}
      <FormSubmit error={state?.status === "error" ? state.message : null} isPending={isPending} copy={COPY} />
      <Button variant="tertiary" className="min-h-11 justify-self-start" onPress={onCancel}>
        {COPY.cancel}
      </Button>
    </Form>
  );
}
