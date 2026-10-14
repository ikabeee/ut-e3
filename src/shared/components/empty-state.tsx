import type { ComponentType, ReactNode, SVGProps } from "react";
import { EmptyState as HeroEmptyState, cn } from "@heroui/react";

export type EmptyStateIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface EmptyStateProps {
  /**
   * Componente de icono de Gravity UI a mostrar.
   */
  icon?: EmptyStateIcon;
  /**
   * Mensaje principal o título del estado vacío.
   */
  title?: ReactNode;
  /**
   * Descripción secundaria o texto aclaratorio.
   */
  description?: ReactNode;
  /**
   * Contenido interactivo o secundario adicional (botones, enlaces, etc.).
   */
  children?: ReactNode;
  /**
   * Variante visual del contenedor.
   * - "dashed": Borde punteado acorde a los paneles UTG (por defecto).
   * - "subtle": Borde sólido y fondo sutil.
   * - "plain": Sin borde ni fondo extra, sólo centrado con espaciado.
   */
  variant?: "dashed" | "subtle" | "plain";
  /**
   * Tamaño del bloque y de sus elementos:
   * - "sm": Compacto para el interior de tarjetas o listas secundarias.
   * - "md": Tamaño estándar para paneles o secciones (por defecto).
   * - "lg": Tamaño amplio para catálogos o vistas completas.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Clases adicionales de Tailwind.
   */
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<EmptyStateProps["variant"]>, string> = {
  dashed: "border border-dashed border-border bg-surface/20",
  subtle: "border border-border bg-surface/50",
  plain: "",
};

const SIZE_STYLES: Record<NonNullable<EmptyStateProps["size"]>, { container: string; icon: string }> = {
  sm: {
    container: "gap-2 px-3 py-5 text-sm",
    icon: "size-7 [&>svg]:size-5",
  },
  md: {
    container: "gap-3 px-5 py-8 text-sm",
    icon: "size-9 [&>svg]:size-7",
  },
  lg: {
    container: "gap-4 px-6 py-12 text-base",
    icon: "size-12 [&>svg]:size-9",
  },
};

/**
 * Estado vacío centrado con soporte para iconos de Gravity UI y estética UTG.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  variant = "dashed",
  size = "md",
  className,
}: Readonly<EmptyStateProps>) {
  const sizeStyles = SIZE_STYLES[size];

  return (
    <HeroEmptyState
      className={cn(
        "flex flex-col items-center justify-center text-center",
        VARIANT_STYLES[variant],
        sizeStyles.container,
        className,
      )}
    >
      {Icon ? (
        <div className={cn("grid place-items-center text-muted", sizeStyles.icon)} aria-hidden="true">
          <Icon />
        </div>
      ) : null}

      {title ? <p className="m-0 font-medium text-copy-warm">{title}</p> : null}

      {description ? <p className="m-0 text-xs text-muted">{description}</p> : null}

      {children}
    </HeroEmptyState>
  );
}
