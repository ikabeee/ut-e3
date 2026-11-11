import { FormFeedback } from "@shared/components/form-feedback";
import { FormSubmit } from "@shared/components/form-submit";

interface ActionFormFooterProps {
  /** What the Server Action answered last: a message when it worked, an error when it did not. */
  state: { status: "done" | "error"; message: string } | null;
  isPending: boolean;
  copy: { submit: string; pending: string };
}

/** The end of a form that posts to a Server Action: what it answered and the button that sends it. */
export function ActionFormFooter({ state, isPending, copy }: Readonly<ActionFormFooterProps>) {
  return (
    <>
      <FormFeedback state={state?.status === "done" ? state : null} />
      <FormSubmit error={state?.status === "error" ? state.message : null} isPending={isPending} copy={copy} />
    </>
  );
}
