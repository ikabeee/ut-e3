import { createRandom, drawGameArt } from "@features/games/lib/game-art";

describe("createRandom", () => {
  it("returns the same sequence for the same seed", () => {
    const first = createRandom(797);
    const second = createRandom(797);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("returns values between 0 and 1", () => {
    const random = createRandom(42);
    const values = Array.from({ length: 200 }, () => random());

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("does not get stuck with seed 0", () => {
    const random = createRandom(0);

    expect(random()).not.toBe(random());
  });
});

describe("drawGameArt", () => {
  function createContextMock() {
    const calls: string[] = [];
    const ctx = new Proxy(
      {},
      {
        get: (_target, property: string) => (...args: unknown[]) => calls.push(`${property}(${args.length})`),
        set: () => true,
      },
    ) as unknown as CanvasRenderingContext2D;
    return { ctx, calls };
  }

  it("paints the background with the palette color and writes the scan data on wide canvases", () => {
    const { ctx, calls } = createContextMock();
    const resolveColor = jest.fn((color: string) => `color-${color}`);

    drawGameArt(
      { ctx, width: 640, height: 360, resolveColor, monoFontFamily: "monospace" },
      { seed: 3, palette: ["acid", "panel"] },
      { stand: "A4", genre: "Carreras", members: 4 },
    );

    expect(resolveColor).toHaveBeenCalledWith("panel");
    expect(resolveColor).toHaveBeenCalledWith("acid");
    expect(calls.filter((call) => call.startsWith("fillText"))).toHaveLength(10);
  });

  it("skips the scan data on narrow canvases", () => {
    const { ctx, calls } = createContextMock();

    drawGameArt(
      { ctx, width: 200, height: 260, resolveColor: String, monoFontFamily: "monospace" },
      { seed: 0, palette: ["acid", "black"] },
      { stand: "A1", genre: "Acción", members: 5 },
    );

    expect(calls.some((call) => call.startsWith("fillText"))).toBe(false);
  });
});
