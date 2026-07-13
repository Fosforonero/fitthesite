/**
 * OG image per /delete-account: stesso fallback icon-only condiviso (vedi
 * `app/(frontend)/[locale]/opengraph-image.tsx` per il perché del
 * re-export invece di un import diretto — comportamento Next.js verificato
 * su come `openGraph` viene risolto per-segmento).
 */
export { alt, size, contentType, default } from "@/lib/og/fallback-image";
