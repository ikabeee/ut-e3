import { Spinner, cn } from "@heroui/react";

interface LoadingStateProps {
  /** What is loading, from the copy of the feature; it names the spinner and stays visible next to it. */
  label: string;
  className?: string;
}

/** The loading state outside the panels (S6): a spinner that says what it waits for. */
export function LoadingState({ label, className }: Readonly<LoadingStateProps>) {
  return (
    <div className={cn("flex items-center gap-3 type-mono text-muted", className)}>
      <Spinner aria-label={label} color="current" />
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
