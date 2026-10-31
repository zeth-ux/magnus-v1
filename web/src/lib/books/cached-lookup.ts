import "server-only";
import { cacheLife } from "next/cache";
import { lookupIsbn } from "./lookup";

/**
 * The ISBN lookup, cached for days per ISBN (book details rarely change), so
 * repeated finds don't use up the services' free quota.
 */
export async function cachedLookup(isbn: string) {
  "use cache";
  cacheLife("days");
  return lookupIsbn(isbn);
}
