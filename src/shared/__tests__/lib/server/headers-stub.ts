import type * as NextHeaders from "next/headers";
import type * as NextServer from "next/server";

export type TaskCallback = () => void | Promise<void>;

export function stubHeaders(entries: Record<string, string> = {}) {
  const nextHeaders = jest.requireActual<typeof NextHeaders>("next/headers");
  const headersInstance = new Headers(entries);

  return jest.spyOn(nextHeaders, "headers").mockResolvedValue(headersInstance);
}

export function stubAfter() {
  const nextServer = jest.requireActual<typeof NextServer>("next/server");
  const callbacks: TaskCallback[] = [];

  const spy = jest.spyOn(nextServer, "after").mockImplementation((task) => {
    if (isFunctionTask(task)) {
      callbacks.push(task);
    }
  });

  return {
    callbacks,
    restore: () => spy.mockRestore(),
  };
}

function isFunctionTask(task: unknown): task is TaskCallback {
  return typeof task === "function";
}
