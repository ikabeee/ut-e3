import { Skeleton } from "@heroui/react";

interface PanelSkeletonProps {
  /** What is loading, from the copy of the feature; only assistive technology reads it. */
  label: string;
  /** The shape of the panel under its header: sections with rows (lists, dashboards) or the fields of one form. */
  layout?: "list" | "form";
}

const LIST_SECTIONS = ["first", "second"];

const LIST_ROWS = ["first", "second", "third"];

const FORM_FIELDS = ["first", "second", "third", "fourth"];

/** The loading state of every panel, whatever the role (S12): bars in the shape of the header and the content. */
export function PanelSkeleton({ label, layout = "list" }: Readonly<PanelSkeletonProps>) {
  return (
    <div role="status" className="grid gap-10">
      <span className="sr-only">{label}</span>
      <HeaderSkeleton />
      {layout === "form" ? <FormSkeleton /> : <ListSkeleton />}
    </div>
  );
}

// The header of the panels: the title, who is signed in and the row of links and buttons.
function HeaderSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-4 w-56 max-w-full" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-11 w-28" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return LIST_SECTIONS.map((section) => (
    <div key={section} aria-hidden="true" className="grid gap-4">
      <Skeleton className="h-7 w-64 max-w-full" />
      {LIST_ROWS.map((row) => (
        <Skeleton key={row} className="h-20 w-full" />
      ))}
    </div>
  ));
}

function FormSkeleton() {
  return (
    <div aria-hidden="true" className="grid max-w-2xl gap-5">
      {FORM_FIELDS.map((field) => (
        <div key={field} className="grid gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-36" />
    </div>
  );
}
