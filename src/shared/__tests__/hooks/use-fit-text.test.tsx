import { useRef } from "react";
import { act, render } from "@testing-library/react";
import { useFitText } from "@shared/hooks/use-fit-text";

function FitTitle({ text }: Readonly<{ text: string }>) {
  const ref = useRef<HTMLHeadingElement>(null);
  useFitText(ref, text);

  return (
    <div>
      <h2 ref={ref}>
        {text.split(" ").map((word) => (
          <span key={word}>{word}</span>
        ))}
      </h2>
    </div>
  );
}

describe("useFitText", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("measures once per frame however many resize events arrive", () => {
    const measure = jest.spyOn(window, "getComputedStyle");
    render(<FitTitle text="Ceniza Protocol" />);
    measure.mockClear();

    act(() => {
      for (let index = 0; index < 5; index += 1) window.dispatchEvent(new Event("resize"));
      jest.advanceTimersByTime(20);
    });

    expect(measure).toHaveBeenCalledTimes(1);
  });

  it("shrinks the title when its widest word does not fit", () => {
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);

    // SAFETY: la prueba simula el ancho de la caja delimitadora en jsdom.
    const rect = { width: 200 } as DOMRect;
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect);

    // SAFETY: la prueba solo lee fontSize del objeto de estilos computados en jsdom.
    const style = { fontSize: "40px" } as CSSStyleDeclaration;
    jest.spyOn(window, "getComputedStyle").mockReturnValue(style);

    const { getByRole } = render(<FitTitle text="Ceniza Protocol" />);

    // 40 px * (100 / 200) * 0.97 = 19.4 -> 19 px. Se lee `style` porque `getComputedStyle` está simulado.
    expect(getByRole("heading").style.fontSize).toBe("19px");
  });
});
