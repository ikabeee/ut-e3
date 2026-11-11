interface GenericCoverProps {
  /** The name written on the cover. */
  title: string;
  /** Hides the cover from assistive technology, like an image with an empty alt. */
  isDecorative?: boolean;
  /** False where the card already writes the name over the cover. */
  isTitleShown?: boolean;
}

/**
 * The cover of something that has no artwork yet: a plain panel with its title. It fills the nearest positioned
 * ancestor, like an `Image` with `fill`, so it goes where the image would, and it loads no file.
 */
export function GenericCover({ title, isDecorative = false, isTitleShown = true }: Readonly<GenericCoverProps>) {
  return (
    <span
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : title}
      aria-hidden={isDecorative ? true : undefined}
      className="@container absolute inset-0 flex items-center justify-center overflow-hidden bg-linear-to-br from-surface to-accent/35 p-[8%]"
    >
      {isTitleShown ? (
        <span
          aria-hidden="true"
          className="block text-center type-wide text-[11cqw] leading-none wrap-break-word text-foreground"
        >
          {title}
        </span>
      ) : null}
    </span>
  );
}
