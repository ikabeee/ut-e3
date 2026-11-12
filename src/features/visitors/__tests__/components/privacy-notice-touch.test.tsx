import { render, screen } from "@testing-library/react";
import { PrivacyNotice } from "@features/visitors/components/privacy-notice";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";

// S7: the "aviso de privacidad" link is a 44 px touch target (audit M-1). The touch-target utility draws an invisible
// 44x44 px area around a relative element, so the visible 14 px text keeps its size while the finger gets its target.
describe("PrivacyNotice touch target (S7)", () => {
  it("gives the privacy link a 44 px touch target", () => {
    render(<PrivacyNotice />);

    expect(screen.getByRole("link", { name: VISITORS_COPY.privacy.linkText })).toHaveClass("touch-target");
  });

  it("keeps the link to the privacy path", () => {
    render(<PrivacyNotice />);

    expect(screen.getByRole("link", { name: VISITORS_COPY.privacy.linkText })).toHaveAttribute("href", PRIVACY_PATH);
  });
});
