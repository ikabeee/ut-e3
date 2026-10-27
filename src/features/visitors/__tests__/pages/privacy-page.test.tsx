import { render, screen } from "@testing-library/react";
import { PrivacyPage, privacyPageMetadata } from "@features/visitors/pages/privacy-page";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";

describe("PrivacyPage", () => {
  it("renders the heading and notice", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: VISITORS_COPY.privacy.title })).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.privacy.pendingNotice)).toBeInTheDocument();
  });

  it("exports valid metadata with canonical path", () => {
    expect(privacyPageMetadata.title).toBe(VISITORS_COPY.privacy.title);
    expect(privacyPageMetadata.alternates?.canonical).toBe(PRIVACY_PATH);
  });
});
