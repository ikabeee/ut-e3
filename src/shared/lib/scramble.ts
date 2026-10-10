/** Caracteres de "ruido" que aparecen mientras una etiqueta se decodifica. */
export const SCRAMBLE_GLYPHS = "█▓▒░<>/_#=+";

/** Cuadros que dura la animación de decodificación. */
export const SCRAMBLE_FRAMES = 9;

/** Milisegundos entre cuadros. */
export const SCRAMBLE_FRAME_MS = 32;

/**
 * Devuelve la etiqueta en el cuadro `frame`: los primeros caracteres ya están decodificados
 * y el resto se reemplaza por glifos al azar. Los espacios se conservan.
 */
export function scrambleFrame(label: string, frame: number, random: () => number = Math.random) {
  const characters = [...label];
  const revealed = (characters.length * frame) / SCRAMBLE_FRAMES;

  return characters
    .map((character, index) => {
      if (character === " " || index < revealed) {
        return character;
      }
      return SCRAMBLE_GLYPHS[Math.floor(random() * SCRAMBLE_GLYPHS.length)];
    })
    .join("");
}
