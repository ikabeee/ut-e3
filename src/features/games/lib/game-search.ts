/** What the search reads of a game. `extraText` only counts as written (the catalog adds the stand and synopsis). */
export interface GameSearchFields {
  name: string;
  slug: string;
  genreName: string;
  extraText?: string;
}

interface RankedGame<Game> {
  game: Game;
  rank: number;
}

const CONTAINS_TEXT = 0;

const HAS_LETTERS_IN_ORDER = 1;

// Shorter keywords would match almost every word by their letters in order.
const MIN_LOOSE_LENGTH = 3;

/**
 * The games that match a keyword (S21), ignoring accents and case: first the ones whose name, slug, genre or extra
 * text contains it, then the ones where each word of the keyword has its letters in order inside one word of the name,
 * slug or genre ("san" finds Saatal Paal through saatan-paal). Each group keeps the order it received.
 */
export function searchGames<Game>(
  games: readonly Game[],
  keyword: string,
  getFields: (game: Game) => GameSearchFields,
): Game[] {
  const query = normalizeText(keyword.trim());

  if (query === "") return [...games];

  return games
    .flatMap((game): RankedGame<Game>[] => {
      const rank = rankMatch(getFields(game), query);

      return rank === null ? [] : [{ game, rank }];
    })
    .toSorted((first, second) => first.rank - second.rank)
    .map((match) => match.game);
}

function rankMatch(fields: GameSearchFields, query: string): number | null {
  const nameSlugGenre = normalizeText(`${fields.name} ${fields.slug} ${fields.genreName}`);

  if (`${nameSlugGenre} ${normalizeText(fields.extraText ?? "")}`.includes(query)) return CONTAINS_TEXT;

  const words = splitWords(nameSlugGenre);

  return splitWords(query).every(
    (part) => nameSlugGenre.includes(part) || words.some((word) => isLooseMatch(word, part)),
  )
    ? HAS_LETTERS_IN_ORDER
    : null;
}

// The letters of the keyword in order inside a word that starts like it and is at most twice as long.
function isLooseMatch(word: string, part: string): boolean {
  if (part.length < MIN_LOOSE_LENGTH || word[0] !== part[0] || word.length > part.length * 2) return false;

  let next = 0;

  for (const letter of word) if (letter === part[next]) next += 1;

  return next >= part.length;
}

function splitWords(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== "");
}

// "Acción" and "accion" match: NFD splits each accent into a combining mark, which the regex removes.
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
