import { useState, type KeyboardEvent } from "react";

type InputPress = KeyboardEvent<HTMLInputElement>;

/**
 * The open state and the active option of the navbar search combobox (S21). The arrows move through the options and
 * wrap around, Enter chooses the active one (without an active one the form sends the search), and Escape closes the
 * list without letting the phone menu around it close too.
 */
export function useSearchCombobox(optionCount: number, choose: (index: number) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  function open() {
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(press: InputPress) {
    if (press.key === "ArrowDown" || press.key === "ArrowUp") moveActive(press);
    else if (press.key === "Enter" && isOpen && activeIndex >= 0) chooseActive(press);
    else if (press.key === "Escape" && isOpen) closeOnEscape(press);
  }

  function moveActive(press: InputPress) {
    press.preventDefault();
    setIsOpen(true);

    if (optionCount === 0) return;

    const step = press.key === "ArrowDown" ? 1 : -1;
    const start = activeIndex < 0 && step < 0 ? 0 : activeIndex;

    setActiveIndex((start + step + optionCount) % optionCount);
  }

  function chooseActive(press: InputPress) {
    press.preventDefault();
    choose(activeIndex);
    close();
  }

  function closeOnEscape(press: InputPress) {
    press.preventDefault();
    press.stopPropagation();
    close();
  }

  return { isOpen, activeIndex: Math.min(activeIndex, optionCount - 1), open, close, handleKeyDown };
}
