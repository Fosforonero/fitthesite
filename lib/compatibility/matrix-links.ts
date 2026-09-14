import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { providerLinkHref } from "@/lib/providers/indexability";
import { blogLinkHrefSync } from "@/lib/blog/indexability";
import type { SupportedMatrixLocale } from "@/lib/compatibility/glossary-data";

export interface ResolvedMatrixLink {
  href: string;
  isFallbackEn: boolean;
}

/**
 * Resolves localized direct 200 URL for a compatibility path's documentation.
 * - If path specifies a guideSlug, resolves via localized blog slug SSOT.
 * - If path specifies null guideSlug, link is omitted.
 * - Otherwise falls back to providerLinkHref SSOT.
 * Returns null if no indexable variant exists.
 */
export function resolveGuideLink(
  path: { guideSlug?: string | null; providerSlug: string },
  locale: SupportedMatrixLocale
): ResolvedMatrixLink | null {
  if (path.guideSlug === null) return null;

  if (path.guideSlug) {
    const href = blogLinkHrefSync(path.guideSlug, locale);
    if (!href) return null;
    const isFallbackEn = locale !== "en" && href.startsWith("/en/");
    return { href, isFallbackEn };
  }

  const provider = PROVIDERS_BY_SLUG[path.providerSlug];
  if (!provider) return null;
  const href = providerLinkHref(provider, locale);
  if (!href) return null;
  const isFallbackEn = locale !== "en" && href.startsWith("/en/");
  return { href, isFallbackEn };
}

/**
 * Resolves localized direct 200 URL for unverified combinations.
 */
export function resolveUnverifiedLink(
  providerSlug: string,
  locale: SupportedMatrixLocale
): ResolvedMatrixLink | null {
  const provider = PROVIDERS_BY_SLUG[providerSlug];
  if (!provider) return null;
  const href = providerLinkHref(provider, locale);
  if (!href) return null;
  const isFallbackEn = locale !== "en" && href.startsWith("/en/");
  return { href, isFallbackEn };
}
