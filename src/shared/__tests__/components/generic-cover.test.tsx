import { render, screen } from "@testing-library/react";
import { GenericCover } from "@shared/components/generic-cover";

describe("GenericCover", () => {
  it("is an image named after the title and writes the title on the cover", () => {
    render(<GenericCover title="One Mind" />);

    expect(screen.getByRole("img", { name: "One Mind" })).toHaveTextContent("One Mind");
  });

  it("hides from assistive technology when it is decorative", () => {
    render(<GenericCover title="One Mind" isDecorative />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("leaves the title out where the card writes it", () => {
    render(<GenericCover title="One Mind" isTitleShown={false} />);

    expect(screen.getByRole("img", { name: "One Mind" })).toBeEmptyDOMElement();
  });
});
