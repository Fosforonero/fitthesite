import { permanentRedirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";

/**
 * Root path: redirect to the default locale.
 * Long term we could auto-detect Accept-Language via middleware, but for now
 * we send everyone to /it (brand default).
 *
 * Uses `permanentRedirect` (308) instead of `redirect` (307) — Google
 * Search Console preferisce 308 per locale routing perché signal
 * "canonical permanente" e passa pienamente link equity. Risolve
 * parte degli alert "Page with redirect" su Search Console.
 */
export default function Root() {
  permanentRedirect(`/${defaultLocale}`);
}
