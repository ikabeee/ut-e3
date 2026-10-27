import { startTransition, type FormEvent } from "react";

// React resets a <form action={...}> once the action finishes, which would wipe what was typed when the server
// answers with an error. Dispatching from onSubmit inside a transition keeps the values and still drives isPending.
export function useSubmitKeepingValues(formAction: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    startTransition(() => formAction(form));
  };
}
