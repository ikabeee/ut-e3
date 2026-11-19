/**
 * @jest-environment node
 */
import { installConsoleCapture, MAX_CAPTURED_PER_MINUTE } from "@shared/lib/server/console-capture";
import type * as Capture from "@shared/lib/server/console-capture";
import type { ServerLogLevel, ServerLogSource } from "@shared/lib/server-log-types";

interface Written {
  level: ServerLogLevel;
  source: ServerLogSource;
  message: string;
}

function setup(now: () => number = () => 0) {
  const target = createFakeConsole();
  const original = { error: target.error, warn: target.warn };
  const written: Written[] = [];

  const write = async (level: ServerLogLevel, source: ServerLogSource, message: string) => {
    written.push({ level, source, message });
  };

  const uninstall = installConsoleCapture({ target, write, now });

  return { target, original, written, uninstall };
}

function createFakeConsole() {
  return { error: jest.fn(), warn: jest.fn(), log: jest.fn() };
}

describe("installConsoleCapture", () => {
  it("still prints and also records console.error and console.warn from the console source", () => {
    const { target, original, written } = setup();

    target.error("Boom", 42);
    target.warn("Careful");

    expect(original.error).toHaveBeenCalledWith("Boom", 42);
    expect(original.warn).toHaveBeenCalledWith("Careful");
    expect(written).toEqual([
      { level: "error", source: "console", message: "Boom 42" },
      { level: "warn", source: "console", message: "Careful" },
    ]);
  });

  it("does not capture console.log", () => {
    const { target, written } = setup();

    target.log("hello");

    expect(written).toEqual([]);
  });

  it("is installed once: a second install does not record a message twice", () => {
    const { target, written } = setup();

    installConsoleCapture({ target, write: async () => undefined });
    target.error("once");

    expect(written).toHaveLength(1);
  });

  it("does not loop when recording a message prints another one", () => {
    const target = createFakeConsole();

    const write = jest.fn(async () => {
      target.error("while recording");
    });

    installConsoleCapture({ target, write });
    target.error("first");

    expect(write).toHaveBeenCalledTimes(1);
  });

  it("records at most MAX_CAPTURED_PER_MINUTE per minute and starts over the next minute", () => {
    let clock = 0;
    const { target, original, written } = setup(() => clock);

    for (let count = 0; count < MAX_CAPTURED_PER_MINUTE + 5; count += 1) target.error(`m${count}`);

    expect(original.error).toHaveBeenCalledTimes(MAX_CAPTURED_PER_MINUTE + 5);
    expect(written).toHaveLength(MAX_CAPTURED_PER_MINUTE);

    clock = 61_000;
    target.error("later");

    expect(written.at(-1)).toMatchObject({ message: "later" });
  });

  it("records a console.error once when two copies of the module are installed (hot reload)", () => {
    const target = createFakeConsole();
    const write = jest.fn(async () => undefined);

    jest.isolateModules(() => {
      jest.requireActual<typeof Capture>("@shared/lib/server/console-capture").installConsoleCapture({ target, write });
    });
    jest.isolateModules(() => {
      jest.requireActual<typeof Capture>("@shared/lib/server/console-capture").installConsoleCapture({ target, write });
    });
    target.error("once");

    expect(write).toHaveBeenCalledTimes(1);
  });

  it("puts the original functions back when uninstalled", () => {
    const { target, original, uninstall } = setup();

    uninstall();

    expect(target.error).toBe(original.error);
    expect(target.warn).toBe(original.warn);
  });
});
