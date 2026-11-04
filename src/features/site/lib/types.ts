/** A way out of the 404: the page builds the list, because the site feature does not know the routes of the others. */
export interface NotFoundExit {
  href: string;
  label: string;
  description: string;
}
