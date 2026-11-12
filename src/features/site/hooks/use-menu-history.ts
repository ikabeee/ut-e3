"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The open state of the phone menu with a same-URL history entry behind it, so the Back gesture closes the menu and
 * stays on the page. Closing by any other means removes that entry again so history stays clean.
 */
export function useMenuHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const pushedEntry = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnPopState() {
      pushedEntry.current = false;
      setIsOpen(false);
    }

    window.addEventListener("popstate", closeOnPopState);

    return () => window.removeEventListener("popstate", closeOnPopState);
  }, [isOpen]);

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen);

    if (nextOpen) {
      pushedEntry.current = true;
      window.history.pushState({ siteNavMenu: true }, "", window.location.href);
    } else if (pushedEntry.current) {
      pushedEntry.current = false;
      window.history.back();
    }
  }

  function handleChoose() {
    // Choosing a link already navigates away, so going back here would undo that navigation: just forget the entry.
    pushedEntry.current = false;
    setIsOpen(false);
  }

  return { isOpen, handleOpenChange, handleChoose };
}
