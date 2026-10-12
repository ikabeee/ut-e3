/** Opción de una lista del panel (Select o casillas): el `value` es el id que se envía. */
export interface AdminOption {
  value: string;
  label: string;
}

/** Opciones que necesitan los campos de un juego. */
export interface GameFieldOptions {
  teams: readonly AdminOption[];
  genres: readonly AdminOption[];
  platforms: readonly AdminOption[];
}
