export interface StubbedResponse {
  status: number;
  body: object;
}

type Respond = (url: string) => Promise<StubbedResponse>;

// jsdom has no fetch and no Response; the code under test only reads `ok` and `json()`, so that is all this gives back.
export function stubFetch(respond: Respond) {
  const stub = jest.fn(async (url: string) => {
    const { status, body } = await respond(url);

    return { ok: status >= 200 && status < 300, status, json: async () => body };
  });

  Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: stub });

  return stub;
}

export function restoreFetch(): void {
  Reflect.deleteProperty(globalThis, "fetch");
}
