import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useCoverflowKeyboard } from "@features/games/hooks/use-coverflow-keyboard";

const CASES = ["Uno", "Dos", "Tres"];

// Exhibidor mínimo: tres enlaces, sólo el del frente es enfocable.
function TestCoverflow({ onOpenCurrent }: Readonly<{ onOpenCurrent: () => void }>) {
  const [current, setCurrent] = useState(1);
  const keyboard = useCoverflowKeyboard({
    current,
    goNext: () => setCurrent((index) => Math.min(CASES.length - 1, index + 1)),
    goPrevious: () => setCurrent((index) => Math.max(0, index - 1)),
    onOpenCurrent,
  });

  return (
    <div onKeyDown={keyboard.onKeyDown}>
      {CASES.map((name, index) => (
        <a key={name} ref={keyboard.caseRef(index)} href={`#${name}`} tabIndex={index === current ? 0 : -1}>
          {name}
        </a>
      ))}
    </div>
  );
}

describe("useCoverflowKeyboard", () => {
  it("moves with the arrows and keeps the focus on the front case", () => {
    render(<TestCoverflow onOpenCurrent={jest.fn()} />);

    fireEvent.keyDown(screen.getByRole("link", { name: "Dos" }), { key: "ArrowRight" });
    expect(screen.getByRole("link", { name: "Tres" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("link", { name: "Tres" }), { key: "ArrowLeft" });
    expect(screen.getByRole("link", { name: "Dos" })).toHaveFocus();
  });

  it("opens the front case with the space bar", () => {
    const onOpenCurrent = jest.fn();
    render(<TestCoverflow onOpenCurrent={onOpenCurrent} />);

    fireEvent.keyDown(screen.getByRole("link", { name: "Dos" }), { key: " " });

    expect(onOpenCurrent).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onOpenCurrent = jest.fn();
    render(<TestCoverflow onOpenCurrent={onOpenCurrent} />);

    fireEvent.keyDown(screen.getByRole("link", { name: "Dos" }), { key: "a" });

    expect(onOpenCurrent).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Dos" })).toHaveAttribute("tabindex", "0");
  });
});
