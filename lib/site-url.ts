/**
 * lib/site-url.ts — SITE_URL / CANONICAL_HOST, UNICA fonte di verità.
 *
 * Modulo minimo e client-safe: zero import di PROVIDERS/BLOG_POSTS/altri
 * dati pesanti, così è sicuro importarlo da un componente client (es.
 * `LanguageSwitcher`) senza trascinarsi dietro il resto di
 * `lib/product-facts.ts` (che importa `PROVIDERS`, prezzi, flag).
 *
 * `product-facts.ts` RIESPORTA `SITE_URL` da qui (non lo ridichiara): tutti
 * gli importer esistenti (`from "@/lib/product-facts"`) restano invariati.
 * Chi ha bisogno solo dell'URL/host — senza il resto di product-facts —
 * importa direttamente da qui. Una sola stringa canonica nel repo: nessun
 * modulo la ridichiara con un proprio letterale.
 */
export const SITE_URL = "https://www.fitmesh.fit";

/** Host canonico derivato da SITE_URL — mai un letterale separato. */
export const CANONICAL_HOST = new URL(SITE_URL).hostname;
