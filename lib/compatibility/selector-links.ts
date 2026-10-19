import { blogLinkHrefSync } from "@/lib/blog/indexability";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { SELECTOR_GUIDE_SLUGS } from "./selector-registry";

export type SelectorGuideLinkMap = Record<
  string,
  { it: string | null; en: string | null }
>;

/**
 * Resolves a single canonical blog slug for a given selector locale ("it" | "en").
 * - If `blogLinkHrefSync` returns a string: the variant is indexable -> return the direct URL.
 * - If `blogLinkHrefSync` returns `null`: the variant is explicitly non-indexable/withdrawn -> return `null` (do NOT recreate the link).
 * - If `blogLinkHrefSync` returns `undefined`: the slug is unknown to the static `BLOG_POSTS` list (e.g. CMS-only) -> fall back to `localizedBlogSlug`.
 */
export function resolveSelectorGuideHref(
  canonicalSlug: string,
  locale: "it" | "en"
): string | null {
  const synced = blogLinkHrefSync(canonicalSlug, locale);
  if (synced === null) {
    return null;
  }
  if (typeof synced === "string") {
    return synced;
  }
  return `/${locale}/blog/${localizedBlogSlug(canonicalSlug, locale)}`;
}

/**
 * Builds the small serializable map of guide links on the server so client components
 * never import the blog corpus or nordic overlay.
 */
export function buildSelectorGuideLinkMap(
  slugs: readonly string[] = SELECTOR_GUIDE_SLUGS
): SelectorGuideLinkMap {
  const map: SelectorGuideLinkMap = {};
  for (const slug of slugs) {
    map[slug] = {
      it: resolveSelectorGuideHref(slug, "it"),
      en: resolveSelectorGuideHref(slug, "en"),
    };
  }
  return map;
}
