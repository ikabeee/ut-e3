import { useState } from "react";

interface VisitSelection {
  selected: ReadonlySet<string>;
  toggle: (id: string) => void;
  toggleAll: (isChecked: boolean) => void;
}

/** Which visits of a list are ticked. */
export function useVisitSelection(ids: readonly string[]): VisitSelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);

    if (!next.delete(id)) next.add(id);

    setSelected(next);
  };

  const toggleAll = (isChecked: boolean) => setSelected(new Set(isChecked ? ids : []));

  return { selected, toggle, toggleAll };
}
