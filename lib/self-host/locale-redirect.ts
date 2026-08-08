import type { Locale } from "@/lib/i18n";

/**
 * MICRO-GATE P0.13B (2026-08-08): fonte di verità unica per il locale reale
 * di `/self-host` (Sprint P0.11-A — la pagina esiste solo it/en, le altre 13
 * locale collassano su `/en/self-host` con un redirect lato server, vedi
 * `app/(frontend)/[locale]/(marketing)/self-host/page.tsx`).
 *
 * Prima di questo fix la funzione era locale a `self-host/page.tsx` (usata
 * solo per il redirect stesso) mentre `about/page.tsx` costruiva il link
 * come `/${lc}/self-host` incondizionato: per le 13 locale senza pagina
 * reale, un anchor da una pagina indicizzabile finiva su un redirect
 * "evitabile" (il target finale, `/en/self-host`, è calcolabile in anticipo
 * — non serve passare dal redirect). Estratta qui (stesso motivo delle
 * costanti in `lib/content/static-page-locales.ts`: non può vivere dentro
 * un modulo `page.tsx`, Next.js valida gli export nominati consentiti) così
 * ogni link diretto verso `/self-host` usa la stessa risoluzione della
 * pagina che lo serve, invece di ricostruirla o generare un href che poi
 * viene reindirizzato.
 */
export function resolveSelfHostLocale(locale: Locale): "it" | "en" {
  return locale === "it" ? "it" : "en";
}
