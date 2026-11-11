/** Quita acentos y pasa a minúsculas para comparar textos ("Xibalbá" -> "xibalba"). */
export function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Número con dos dígitos: 7 -> "07". */
export function padTwoDigits(value: number) {
  return String(value).padStart(2, "0");
}

/** Elige la forma singular o plural según la cantidad: `pluralize(1, "juego", "juegos")`. */
export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
