export interface LogoBox {
  area: number;
  maxWidth: number;
  maxHeight: number;
}

export interface LogoSize {
  width: number;
  height: number;
}

// The logo areas of the approved ticket design, in px: the wide ticket and the narrow one (phones, two columns).
export const WIDE_LOGO_BOX: LogoBox = { area: 5200, maxWidth: 104, maxHeight: 84 };

export const COMPACT_LOGO_BOX: LogoBox = { area: 3400, maxWidth: 80, maxHeight: 64 };

/**
 * The size that gives every logo the same visual area whatever its shape, so a wide wordmark and a round badge weigh
 * the same. A logo that would overflow the box shrinks until it fits, keeping its aspect ratio (width / height).
 */
export function getBalancedLogoSize(aspectRatio: number, box: LogoBox): LogoSize {
  const height = Math.sqrt(box.area / aspectRatio);
  const width = height * aspectRatio;
  const scale = Math.min(1, box.maxWidth / width, box.maxHeight / height);

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
