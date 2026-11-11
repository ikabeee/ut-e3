// Letras "UTG" en bloques; el mismo trazo se apila para dar volumen.
const LOGO_PATH =
  "M0 0 L2 0 L2 4 L3 4 L3 0 L5 0 L5 5 L4 6 L1 6 L0 5Z M5.7 0 L10.7 0 L10.7 2 L9.2 2 L9.2 6 L7.2 6 L7.2 2 L5.7 2Z M12.4 0 L16.4 0 L16.4 1.6 L13.4 1.6 L13.4 4.4 L14.4 4.4 L14.4 2.6 L16.4 2.6 L16.4 5 L15.4 6 L12.4 6 L11.4 5 L11.4 1Z";

// Capas de la extrusión del logo de la navegación (de atrás hacia adelante).
const EXTRUSION_OFFSETS = [0.63, 0.56, 0.49, 0.42, 0.35, 0.28, 0.21, 0.14, 0.07];

interface UtgLogoProps {
  /** `extruded`: logo de la navegación. `flat`: logo grande del video principal. */
  variant: "extruded" | "flat";
  className?: string;
  /** Si se omite, el logo es decorativo (`aria-hidden`). */
  label?: string;
}

export function UtgLogo({ variant, className, label }: Readonly<UtgLogoProps>) {
  const gradientId = `utg-gradient-${variant}`;
  const a11yProps = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg className={className} viewBox="-0.3 -0.3 17.4 7.2" {...a11yProps}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--utg-blue-1)" />
          <stop offset=".55" stopColor="var(--utg-acid)" />
          <stop offset="1" stopColor="var(--utg-blue-4)" />
        </linearGradient>
      </defs>
      {variant === "extruded" ? (
        <>
          <path d={LOGO_PATH} transform="translate(.75 .75)" fill="var(--utg-black)" />
          {EXTRUSION_OFFSETS.map((offset) => (
            <path
              key={offset}
              d={LOGO_PATH}
              transform={`translate(${offset} ${offset})`}
              fill="var(--utg-blue-5)"
            />
          ))}
        </>
      ) : (
        <path d={LOGO_PATH} transform="translate(.45 .45)" fill="var(--utg-black)" />
      )}
      <path d={LOGO_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
}
