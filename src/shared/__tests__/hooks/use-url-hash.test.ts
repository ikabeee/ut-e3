import { act, renderHook } from "@testing-library/react";
import { useUrlHash } from "@shared/hooks/use-url-hash";

function renderWithHash(hash: string) {
  window.history.replaceState(null, "", `/floor-plan${hash}`);

  return renderHook(() => useUrlHash());
}

describe("useUrlHash", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("returns the hash without the leading #", () => {
    const { result } = renderWithHash("#A1");

    expect(result.current[0]).toBe("A1");
  });

  it("decodes percent-encoded accents", () => {
    const { result } = renderWithHash("#%C3%A1rea-m%C3%BAsica");

    expect(result.current[0]).toBe("área-música");
  });

  it("returns an empty string when the hash is malformed", () => {
    const { result } = renderWithHash("#%E0%A4%A");

    expect(result.current[0]).toBe("");
  });

  it("updates the URL and the state when setting the hash", () => {
    const { result } = renderWithHash("");

    act(() => result.current[1]("área"));

    expect(window.location.hash).toBe("#%C3%A1rea");
    expect(result.current[0]).toBe("área");
  });
});
