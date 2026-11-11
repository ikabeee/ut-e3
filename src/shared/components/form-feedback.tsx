interface FormFeedbackProps {
  state: { status: "done" | "error"; message: string } | null;
}

/** What a Server Action answered, announced to assistive technology: a status when it worked, an alert when it did not. */
export function FormFeedback({ state }: Readonly<FormFeedbackProps>) {
  if (state?.status === "done") {
    return (
      <p role="status" className="text-sm text-success">
        {state.message}
      </p>
    );
  }

  if (state?.status === "error") {
    return (
      <p role="alert" className="text-sm text-danger">
        {state.message}
      </p>
    );
  }

  return null;
}
