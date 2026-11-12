"use client";

import Image from "next/image";
import { useState, type CSSProperties, type SyntheticEvent } from "react";
import {
  COMPACT_LOGO_BOX,
  WIDE_LOGO_BOX,
  getBalancedLogoSize,
  type LogoBox,
  type LogoSize,
} from "@features/sponsors/lib/balanced-logo-size";

// React types no custom properties; the template key lets them in without an assertion.
type SizeVariables = CSSProperties & Record<`--${string}`, string>;

interface BalancedLogoProps {
  src: string;
  alt: string;
}

/**
 * The logo inside a fixed square, sized from its own aspect ratio once it loads. Until then (and on the server) it
 * fits the whole logo area with object-contain, so nothing moves outside the square when the size arrives.
 */
export function BalancedLogo({ src, alt }: Readonly<BalancedLogoProps>) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <div className="flex size-22 shrink-0 items-center justify-center @min-[420px]:size-28">
      <span
        style={buildSizeVariables(aspectRatio)}
        className="relative block h-(--logo-height) w-(--logo-width) @min-[420px]:h-(--logo-wide-height) @min-[420px]:w-(--logo-wide-width)"
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes="104px"
          className="object-contain"
          onLoad={(event) => setAspectRatio(readAspectRatio(event))}
        />
      </span>
    </div>
  );
}

function buildSizeVariables(aspectRatio: number | null): SizeVariables {
  const compact = getLogoSize(aspectRatio, COMPACT_LOGO_BOX);
  const wide = getLogoSize(aspectRatio, WIDE_LOGO_BOX);

  return {
    "--logo-width": `${compact.width}px`,
    "--logo-height": `${compact.height}px`,
    "--logo-wide-width": `${wide.width}px`,
    "--logo-wide-height": `${wide.height}px`,
  };
}

function getLogoSize(aspectRatio: number | null, box: LogoBox): LogoSize {
  return aspectRatio === null ? { width: box.maxWidth, height: box.maxHeight } : getBalancedLogoSize(aspectRatio, box);
}

// A logo without intrinsic size (an SVG with no width or height) keeps fitting the whole box.
function readAspectRatio(event: SyntheticEvent<HTMLImageElement>): number | null {
  const { naturalWidth, naturalHeight } = event.currentTarget;

  return naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : null;
}
