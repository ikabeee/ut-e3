import { cn } from "@heroui/react";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { GAMES_SEARCH_ACTION, GAMES_SEARCH_PARAM } from "@features/site/lib/site-navigation";

interface SiteSearchFormProps {
  className?: string;
  /** The phone menu closes itself when the search is sent. */
  onSubmit?: () => void;
}

/**
 * The game search of the navbar: a plain GET form that lands on the catalog as /games?q=<text>, so it works without
 * scripts and the catalog reads the text from its URL. The field is 16 px so Safari on iOS does not zoom on focus.
 */
export function SiteSearchForm({ className, onSubmit }: Readonly<SiteSearchFormProps>) {
  return (
    <form
      role="search"
      aria-label={SITE_COPY.nav.search.formLabel}
      action={GAMES_SEARCH_ACTION}
      method="get"
      onSubmit={onSubmit}
      className={cn("flex items-stretch border border-border focus-within:border-accent", className)}
    >
      <input
        type="search"
        name={GAMES_SEARCH_PARAM}
        aria-label={SITE_COPY.nav.search.label}
        placeholder={SITE_COPY.nav.search.label}
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label={SITE_COPY.nav.search.submit}
        className="touch-target relative grid size-11 flex-none place-items-center text-foreground hover:text-accent focus-visible:text-accent"
      >
        <SearchIcon />
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
