"use client";

import { useErrorToast } from "@shared/hooks/use-error-toast";

interface FormFeedbackProps {
  state: { status: "done" | "error"; message: string } | null;
}

/** What a Server Action answered: a status under the form when it worked, a toast when it did not (S7). */
export function FormFeedback({ state }: Readonly<FormFeedbackProps>) {
  useErrorToast(state?.status === "error" ? state.message : null, state);

  if (state?.status !== "done") return null;

  return (
    <p role="status" className="text-sm text-success">
      {state.message}
    </p>
  );
}
