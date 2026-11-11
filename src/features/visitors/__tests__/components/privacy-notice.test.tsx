import { render, screen } from "@testing-library/react";
import { PrivacyNotice } from "@features/visitors/components/privacy-notice";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";

describe("PrivacyNotice", () => {
  it("renders the notice and a link to the privacy path", () => {
    render(<PrivacyNotice />);

    const link = screen.getByRole("link", { name: VISITORS_COPY.privacy.linkText });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", PRIVACY_PATH);
  });
});
