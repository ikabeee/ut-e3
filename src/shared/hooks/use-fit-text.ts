import { useLayoutEffect, type RefObject } from "react";

const FIT_MARGIN = 0.97;

export function useFitText(ref: RefObject<HTMLElement | null>, text: string) {
  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let isActive = true;
    let pendingFrame = 0;

    const fit = () => {
      if (isActive) {
        fitWidestWord(element);
      }
    };

    const scheduleFit = () => {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(fit);
    };

    fit();
    document.fonts.ready.then(fit).catch(() => undefined);
    window.addEventListener("resize", scheduleFit);

    return () => {
      isActive = false;
      cancelAnimationFrame(pendingFrame);
      window.removeEventListener("resize", scheduleFit);
    };
  }, [ref, text]);
}

function fitWidestWord(element: HTMLElement) {
  element.style.fontSize = "";
  const maxFontSize = Number.parseFloat(getComputedStyle(element).fontSize);
  const available = element.parentElement?.clientWidth ?? 0;
  const widest = measureWidestWord(element);

  if (available > 0 && widest > available) {
    const fittedFontSize = (maxFontSize * available) / widest;
    element.style.fontSize = `${Math.floor(fittedFontSize * FIT_MARGIN)}px`;
  }
}

function measureWidestWord(element: HTMLElement) {
  let widest = 0;

  for (const word of element.children) {
    widest = Math.max(widest, word.getBoundingClientRect().width);
  }

  return widest;
}
