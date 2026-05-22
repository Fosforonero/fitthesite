/**
 * Keyword pool loader.
 *
 * Reads data/seo/goldmine-keywords.json and provides helpers for
 * finding uncovered keywords and marking them as covered.
 *
 * NOTE: In a Vercel serverless environment the filesystem is read-only
 * (except /tmp). Marking keywords as covered in production requires
 * committing the updated JSON via GitHub API. The `markCovered` function
 * returns the updated JSON string for the caller to commit.
 */
import { readFileSync } from "fs";
import path from "path";

import type { GoldmineKeyword, GoldmineKeywordPool } from "../types";

const POOL_PATH = path.join(process.cwd(), "data", "seo", "goldmine-keywords.json");

export function loadKeywordPool(): GoldmineKeywordPool {
  try {
    const raw = readFileSync(POOL_PATH, "utf-8");
    return JSON.parse(raw) as GoldmineKeywordPool;
  } catch (err) {
    console.error("[keyword-pool] Failed to load goldmine-keywords.json:", err);
    return { categories: [] };
  }
}

/**
 * Returns keywords not yet covered, sorted by volume_estimate descending.
 */
export function getUncoveredByVolume(pool: GoldmineKeywordPool): GoldmineKeyword[] {
  return pool.categories
    .flatMap((c) => c.keywords)
    .filter((k) => !k.covered)
    .sort((a, b) => b.volume_estimate - a.volume_estimate);
}

/**
 * Returns a serialized JSON string with the given keywords marked covered.
 * The caller is responsible for persisting/committing this string.
 */
export function markKeywordsCovered(
  pool: GoldmineKeywordPool,
  queries: string[],
  slugs: string[],
  date: string
): string {
  const querySet = new Set(queries);
  const updated: GoldmineKeywordPool = {
    categories: pool.categories.map((cat) => ({
      ...cat,
      keywords: cat.keywords.map((kw, idx) => {
        if (!querySet.has(kw.query)) return kw;
        const slugIdx = queries.indexOf(kw.query);
        return {
          ...kw,
          covered: true,
          covered_slug: slugs[slugIdx] ?? slugs[0],
          covered_date: date,
        };
      }),
    })),
  };
  return JSON.stringify(updated, null, 2);
}

/**
 * Slugify a keyword query into a URL-safe string.
 */
export function queryToSlug(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
