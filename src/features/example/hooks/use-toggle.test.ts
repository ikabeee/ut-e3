import { act, renderHook } from "@testing-library/react";
import { useToggle } from "@features/example/hooks/use-toggle";

describe("useToggle", () => {
  it("starts with the initial value", () => {
    const { result } = renderHook(() => useToggle(true));

    expect(result.current.isOn).toBe(true);
  });

  it("flips the value on every toggle", () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current.toggle());
    expect(result.current.isOn).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isOn).toBe(false);
  });
});
