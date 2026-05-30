export interface Link {
  /** Short identifier used in the shortened URL path. */
  slug: string;
  /** Destination URL the slug redirects to. */
  url: string;
  /** Optional human title. */
  title?: string;
  /** Optional description (may be AI-generated). */
  description?: string;
  /** Number of times the link has been resolved/visited. */
  clicks: number;
  /** ISO timestamp of creation. */
  createdAt: string;
}
