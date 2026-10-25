import { act, fireEvent, render, screen } from "@testing-library/react";
import { ScrambleText } from "@shared/components/scramble-text";
import { SCRAMBLE_FRAME_MS, SCRAMBLE_FRAMES } from "@shared/lib/scramble";

function mockReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
}

describe("ScrambleText", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the real label available to screen readers", () => {
    render(
      <button type="button">
        <ScrambleText text="Ver todos los juegos" />
      </button>,
    );

    expect(screen.getByRole("button", { name: "Ver todos los juegos" })).toBeInTheDocument();
  });

  it("scrambles on hover and settles back on the label", () => {
    render(
      <a href="#games">
        <ScrambleText text="Juegos" />
      </a>,
    );
    const link = screen.getByRole("link");
    const visibleLabel = link.querySelector("[aria-hidden='true']");

    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(SCRAMBLE_FRAME_MS);
    });
    expect(visibleLabel).not.toHaveTextContent(/^Juegos$/);

    act(() => {
      jest.advanceTimersByTime(SCRAMBLE_FRAME_MS * SCRAMBLE_FRAMES);
    });
    expect(visibleLabel).toHaveTextContent(/^Juegos$/);
  });

  it("shows the new label right away when it changes in the middle of the animation", () => {
    const { rerender } = render(
      <button type="button">
        <ScrambleText text="Copiar dirección" />
      </button>,
    );

    const button = screen.getByRole("button");

    fireEvent.mouseEnter(button);
    act(() => {
      jest.advanceTimersByTime(SCRAMBLE_FRAME_MS);
    });
    rerender(
      <button type="button">
        <ScrambleText text="Copiado" />
      </button>,
    );

    expect(button.querySelector("[aria-hidden='true']")).toHaveTextContent(/^Copiado$/);
  });

  it("does not animate when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    render(
      <a href="#games">
        <ScrambleText text="Juegos" />
      </a>,
    );
    const link = screen.getByRole("link");

    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(SCRAMBLE_FRAME_MS);
    });

    expect(link.querySelector("[aria-hidden='true']")).toHaveTextContent(/^Juegos$/);
  });
});
