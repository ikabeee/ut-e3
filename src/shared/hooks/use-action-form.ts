"use client";

import { useActionState, useEffect, useRef, type FormEvent, type RefObject } from "react";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface ActionFormState {
  status: "done" | "error";
  message: string;
}

export interface ActionForm<State extends ActionFormState> {
  state: State | null;
  formAction: (form: FormData) => void;
  isPending: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * The state of a form that posts to a Server Action: what was typed stays when the server refuses, and the fields are
 * cleared once it accepted. Pass `formRef` and `handleSubmit` to the form, and `formAction` as its `action`.
 */
export function useActionForm<State extends ActionFormState>(
  action: (previous: State | null, form: FormData) => Promise<State>,
): ActionForm<State> {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.status === "done") formRef.current?.reset();
  }, [state]);

  return { state, formAction, isPending, formRef, handleSubmit };
}
