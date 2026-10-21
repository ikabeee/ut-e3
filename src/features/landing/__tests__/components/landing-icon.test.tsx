import { render } from "@testing-library/react";
import { LandingIcon } from "@features/landing/components/landing-icon";

describe("LandingIcon", () => {
  it("masks the named icon file and hides itself from assistive technology", () => {
    const { container } = render(<LandingIcon name="gamepad" className="size-6" />);

    const icon = container.firstElementChild as HTMLElement;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("size-6", "bg-current");
    expect(icon.style.maskImage).toContain("/landing/icons/gamepad.svg");
  });
});
