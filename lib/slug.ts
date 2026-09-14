import { createHash } from "crypto";

const DIACRITICS_RE = /[̀-ͯ]/g;

/**
 * Deterministic, filesystem-independent slug for a PDF filename.
 * Always hash-suffixed (not just on collision) so a book's URL never
 * shifts when sibling files are added or removed from public/.
 */
export function toSlug(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "");
  const normalized = base
    .normalize("NFKD")
    .replace(DIACRITICS_RE, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const hash = createHash("sha1").update(filename).digest("hex").slice(0, 8);
  return `${normalized || "book"}-${hash}`;
}
