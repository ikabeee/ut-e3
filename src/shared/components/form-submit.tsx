import { Button } from "@heroui/react";

interface FormSubmitProps {
  /** What the last attempt answered, if it failed; announced as an alert. */
  error?: string | null;
  isPending: boolean;
  /** For a form that cannot be sent right now, such as a kiosk after the registration closed. */
  isDisabled?: boolean;
  copy: { submit: string; pending: string };
}

/** The end of a form: the error of the last attempt, when there is one, and the button that sends it. */
export function FormSubmit({ error, isPending, isDisabled = false, copy }: Readonly<FormSubmitProps>) {
  return (
    <>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="min-h-11" isPending={isPending} isDisabled={isDisabled}>
        {isPending ? copy.pending : copy.submit}
      </Button>
    </>
  );
}
