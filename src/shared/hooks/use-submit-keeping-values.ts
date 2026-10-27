import { startTransition, type FormEvent } from "react";

// React resets a <form action={...}> once the action finishes, which would wipe what was typed when the server
// answers with an error. Pass the same formAction as `action` (so the form still posts before hydration) and this
// handler as `onSubmit`: once onSubmit prevents the default inside a transition, React marks the form pending without
// running `action` again, and nothing is reset.
export function useSubmitKeepingValues(formAction: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    startTransition(() => formAction(form));
  };
}
