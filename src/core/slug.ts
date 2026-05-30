const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_RE = /^[a-z0-9-]{1,40}$/;

/** Generate a random slug of the given length using [a-z0-9]. */
export function randomSlug(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** A slug is 1-40 chars of lowercase letters, digits, and hyphens. */
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
