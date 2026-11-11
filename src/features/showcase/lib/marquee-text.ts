/** The text of a ribbon of LED letters: upper case and a trailing dash that separates the repetitions. */
export function buildMarqueeText(...words: string[]): string {
  return `${words.join(" ").toUpperCase()} -`;
}
