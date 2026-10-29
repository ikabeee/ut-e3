import { useEffect, useState } from "react";

// Closing a route modal navigates back, and Next hides the route in an <Activity> instead of unmounting it, so React
// Aria never restores the focus. React does run effect cleanups when it hides an Activity: that is where the element
// that opened the modal (the coverflow case) gets the focus back, one frame later, once the dialog's FocusScope has
// stopped containing the focus.
export function useRestoreFocusOnHide() {
  const [opener] = useState(readFocusedElement);

  useEffect(() => () => focusNextFrame(opener), [opener]);
}

function readFocusedElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const focused = document.activeElement;

  return focused instanceof HTMLElement && focused !== document.body ? focused : null;
}

function focusNextFrame(element: HTMLElement | null) {
  if (!element) return;

  requestAnimationFrame(() => element.focus());
}
