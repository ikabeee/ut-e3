import { renderHook, waitFor } from "@testing-library/react";
import { useRestoreFocusOnHide } from "@features/games/hooks/use-restore-focus-on-hide";

describe("useRestoreFocusOnHide", () => {
  it("gives the focus back to the element that had it when the component appeared", async () => {
    const trigger = document.createElement("a");
    const other = document.createElement("button");
    trigger.href = "/games/marea-roja";
    document.body.append(trigger, other);
    trigger.focus();

    const { unmount } = renderHook(() => useRestoreFocusOnHide());
    other.focus();
    unmount();

    await waitFor(() => expect(document.activeElement).toBe(trigger));
    trigger.remove();
    other.remove();
  });

  it("does nothing when no element had the focus", () => {
    const { unmount } = renderHook(() => useRestoreFocusOnHide());

    unmount();

    expect(document.activeElement).toBe(document.body);
  });
});
