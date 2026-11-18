"use client";

import { cn } from "@heroui/react";
import Link from "next/link";
import { useId, useState, type FocusEvent } from "react";
import { getGamePath } from "@features/games/lib/games-links";
import type { GameSuggestion } from "@features/games/lib/types";
import { useGameSuggestions, type GameSuggestionsLoader } from "@features/site/hooks/use-game-suggestions";
import { useSearchCombobox } from "@features/site/hooks/use-search-combobox";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { GAMES_SEARCH_ACTION, GAMES_SEARCH_PARAM } from "@features/site/lib/site-navigation";

interface SiteSearchFormProps {
  className?: string;
  /** The phone menu closes itself when the search is sent or a suggested game is opened. */
  onSubmit?: () => void;
  /** Replaces the request for the public games; the tests use it. */
  loadGames?: GameSuggestionsLoader;
}

type SearchCombobox = ReturnType<typeof useSearchCombobox>;

const COPY = SITE_COPY.nav.search;

/**
 * The game search of the navbar: a plain GET form that lands on the catalog as /games?q=<text>, so it works without
 * scripts and the catalog reads the text from its URL. While typing, a combobox suggests the matching games and links
 * each one to its page (S21).
 */
export function SiteSearchForm({ className, onSubmit, loadGames }: Readonly<SiteSearchFormProps>) {
  const listId = `${useId()}-suggestions`;
  const [query, setQuery] = useState("");
  const suggestions = useGameSuggestions(query, loadGames);
  const combobox = useSearchCombobox(suggestions?.length ?? 0, (index) => openOption(listId, index));
  const isListShown = combobox.isOpen && query.trim() !== "" && suggestions !== null;

  function closeWhenFocusLeaves(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) combobox.close();
  }

  function chooseGame() {
    combobox.close();
    onSubmit?.();
  }

  return (
    <form
      role="search"
      aria-label={COPY.formLabel}
      action={GAMES_SEARCH_ACTION}
      method="get"
      onSubmit={onSubmit}
      onBlur={closeWhenFocusLeaves}
      className={cn("relative flex items-stretch border border-border focus-within:border-accent", className)}
    >
      <SearchField listId={listId} query={query} isListShown={isListShown} combobox={combobox} onType={setQuery} />
      <SearchButton />
      {isListShown ? (
        <Suggestions listId={listId} games={suggestions} activeIndex={combobox.activeIndex} onChoose={chooseGame} />
      ) : null}
    </form>
  );
}

// Enter opens the active game through its own link, so it navigates exactly like a tap on it.
function openOption(listId: string, index: number) {
  document.getElementById(optionId(listId, index))?.click();
}

function optionId(listId: string, index: number): string {
  return `${listId}-${index}`;
}

interface SearchFieldProps {
  listId: string;
  query: string;
  isListShown: boolean;
  combobox: SearchCombobox;
  onType: (query: string) => void;
}

// The field is 16 px so Safari on iOS does not zoom on focus.
function SearchField({ listId, query, isListShown, combobox, onType }: Readonly<SearchFieldProps>) {
  const hasActiveOption = isListShown && combobox.activeIndex >= 0;

  return (
    <input
      type="search"
      role="combobox"
      name={GAMES_SEARCH_PARAM}
      aria-label={COPY.label}
      aria-expanded={isListShown}
      aria-controls={isListShown ? listId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={hasActiveOption ? optionId(listId, combobox.activeIndex) : undefined}
      placeholder={COPY.label}
      autoComplete="off"
      enterKeyHint="search"
      value={query}
      onChange={(event) => {
        onType(event.target.value);
        combobox.open();
      }}
      onKeyDown={combobox.handleKeyDown}
      className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted"
    />
  );
}

function SearchButton() {
  return (
    <button
      type="submit"
      aria-label={COPY.submit}
      className="touch-target relative grid size-11 flex-none place-items-center text-foreground hover:text-accent focus-visible:text-accent"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    </button>
  );
}

interface SuggestionsProps {
  listId: string;
  games: GameSuggestion[];
  activeIndex: number;
  onChoose: () => void;
}

// Below the field and at least 256 px wide, so a name fits even in the narrow field of the bar.
function Suggestions({ listId, games, activeIndex, onChoose }: Readonly<SuggestionsProps>) {
  return (
    <div className="absolute top-full left-0 z-50 mt-px w-full min-w-64 border border-border bg-background">
      {games.length === 0 ? (
        <p role="status" className="m-0 px-3 py-2 text-sm text-muted">
          {COPY.noMatches}
        </p>
      ) : (
        <>
          <p role="status" className="sr-only">
            {COPY.resultCount(games.length)}
          </p>
          <ul id={listId} role="listbox" aria-label={COPY.suggestionsLabel} className="m-0 list-none p-0">
            {games.map((game, index) => (
              <li key={game.slug} role="none">
                <SuggestionOption
                  id={optionId(listId, index)}
                  game={game}
                  isActive={index === activeIndex}
                  onChoose={onChoose}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

interface SuggestionOptionProps {
  id: string;
  game: GameSuggestion;
  isActive: boolean;
  onChoose: () => void;
}

// The focus stays in the field (tabIndex -1): the arrows move the active option through aria-activedescendant.
function SuggestionOption({ id, game, isActive, onChoose }: Readonly<SuggestionOptionProps>) {
  return (
    <Link
      id={id}
      href={getGamePath(game.slug)}
      role="option"
      aria-selected={isActive}
      tabIndex={-1}
      onClick={onChoose}
      className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-foreground no-underline hover:bg-surface hover:text-accent aria-selected:bg-surface aria-selected:text-accent"
    >
      <span className="min-w-0 truncate">{game.name}</span>
      <span className="flex-none type-tiny text-muted">{game.genreName}</span>
    </Link>
  );
}
