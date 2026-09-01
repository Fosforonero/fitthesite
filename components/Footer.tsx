import Link from "next/link";
import Logo from "./Logo";
import type { Dictionary, Locale } from "@/lib/i18n";
import { IMPRINT_NAV_LABEL } from "@/components/legal/TraderIdentity";
import { LANDING_PAGES_BY_SLUG } from "@/lib/landing/data";
import { landingLinkHref } from "@/lib/landing/indexability";
import { resolveLabsLocale } from "@/lib/labs/locale-redirect";
import { famigliaLinkHref } from "@/lib/content/static-page-locales";
import { REDDIT_URL, REDDIT_COMMUNITY_LIVE } from "@/lib/product-facts";
import { COMMUNITY_PLACEMENTS } from "@/lib/analytics/cta";
import RedditIcon from "@/components/RedditIcon";

export default function Footer({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  // Sprint P0.13: landingLinkHref — lc-diretto (slug localizzato) →
  // EN-fallback → nascondi. Prima linkava sempre lo slug canonico IT
  // (`due-telefoni`), funzionante solo grazie al redirect 308 di
  // lp/[slug]/page.tsx quando differiva dallo slug reale della locale —
  // "mai un link che richieda un redirect" (FASE 3).
  const dueTelefoni = LANDING_PAGES_BY_SLUG["due-telefoni"];
  const dueTelefoniHref = dueTelefoni ? landingLinkHref(dueTelefoni, locale) : null;

  return (
    <footer className="relative mt-32 border-t border-white/[0.06]">
      {/* Top accent strip — same gradient as header for symmetry */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(124,255,91,0.45) 30%, rgba(33,230,193,0.55) 50%, rgba(29,161,255,0.45) 70%, transparent 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href={`/${locale}`} prefetch={false} className="inline-block">
            <Logo variant="horizontal" size={42} />
          </Link>
          <p className="mt-5 text-sm text-text-secondary max-w-sm leading-relaxed">
            {dict.footer.tagline}
          </p>

          {/* Status pill */}
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-white/[0.06] bg-white/[0.02] text-xs text-text-muted">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
            </span>
            {locale === "it" ? "Tutti i sistemi operativi" : "All systems operational"}
          </div>
        </div>

        <div className="text-sm lg:col-span-3">
          <div className="text-text-muted mb-4 tracking-[0.22em] uppercase text-[10px] font-semibold">
            {dict.footer.product}
          </div>
          <ul className="space-y-2.5">
            <li><a href={`/${locale}#features`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.features}</a></li>
            {/* Sprint P0.13: era `/${locale}/famiglia` incondizionato — per
                le 7 locale non coperte da COPY in famiglia/page.tsx
                (nl/ja/ko/sv/da/no/fi) linkava una pagina noindex da qui,
                pagina indicizzabile (anchor-verso-noindex, trovato dal
                guardrail). famigliaLinkHref: lc-diretto→EN-fallback, mai
                null perché EN è sempre in FAMIGLIA_COMPLETE_LOCALES. */}
            <li><Link href={famigliaLinkHref(locale)} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Mesh Famiglia" : "Family Mesh"}</Link></li>
            {dueTelefoniHref && (
              <li><Link href={dueTelefoniHref} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Android + iPhone" : "Android + iPhone"}</Link></li>
            )}
            <li><Link href={`/${locale}/integrations`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Integrazioni" : "Integrations"}</Link></li>
            {/* Sprint P0.13: era `/${locale}/labs` — per le 13 locale fuori
                it/en risolveva a una pagina che poi faceva 307 verso
                /en/labs (Labs esiste solo it/en, vedi FASE 3 "mai un link
                che richieda un redirect"). Allineato a Header/MobileMenu,
                che già usavano resolveLabsLocale. */}
            <li><Link href={`/${resolveLabsLocale(locale)}/labs`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">FitMesh Labs</Link></li>
            <li><Link href={`/${locale}/ai`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Condividi con AI" : "Share with AI"}</Link></li>
            <li><Link href={`/${locale}/roadmap`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Roadmap" : "Roadmap"}</Link></li>
            <li><Link href={`/${locale}/blog`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">Blog</Link></li>
            <li><Link href={`/${locale}/novita`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Novità" : "What's New"}</Link></li>
            <li><Link href={`/${locale}/about`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Chi siamo" : "About"}</Link></li>
            <li><Link href={`/${locale}/press`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Press" : "Press"}</Link></li>
            {/*
             * Sprint P0.10L-A: rimosso il link "Founder" dalla navigazione
             * (era classificazione B — non un'offerta, ma comunque un punto
             * di navigazione verso il programma). Sprint P0.13: rimosso
             * anche da Header/MobileMenu, stesso motivo. /beta resta
             * raggiungibile SOLO via URL diretto: pagina statica, 200,
             * noindex/follow, fuori sitemap, invariata. Nessun componente di
             * navigazione punta piu' qui — RESIDUO NOTO: un callout nel
             * corpo del post `fitmesh-sync-disponibile-google-play` linka
             * ancora `/{locale}/beta` in 11 lingue (contenuto editoriale,
             * fuori scope P0.13 — richiede una decisione di prodotto su cosa
             * dire ora che il programma Founder e' chiuso, non una fix
             * tecnica di navigazione; vedi report P0.13).
             */}
            <li><a href={`/${locale}#download`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.download}</a></li>
            <li><Link href={`/${locale}/support`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.support}</Link></li>
            {/* r/FitMesh — gated su REDDIT_COMMUNITY_LIVE (lib/flags.ts).
                rel="noopener noreferrer", NIENTE nofollow/ugc: link
                editoriale ufficiale controllato da FitMesh (non contenuto
                inserito da utenti), non ha senso marcarlo come tale; non
                passa comunque autorità per conto proprio — il beneficio SEO
                reale di questa integrazione è il `sameAs` in
                OrganizationJsonLd, non questo link. noreferrer: non invia
                il Referer a Reddit all'apertura. */}
            {REDDIT_COMMUNITY_LIVE && (
              <li>
                {/* P1.9 FASE 7: icona ufficiale aggiunta come asset locale
                    (RedditIcon.tsx), sempre accanto al testo — mai
                    icon-only. Stesso href/target/rel/data-cta-placement di
                    prima, nessun cambio di comportamento tracciato.
                    ADDENDUM P1.9 (2026-09-01): area cliccabile portata a
                    44px esatti (WCAG 2.5.5/HIG) con py-3 (12px sopra/sotto,
                    text-sm a 20px di line-height => 44px totali) compensato
                    da -my-3 sullo stesso elemento — il padding espande
                    l'hit-area del link, il margine negativo annulla lo
                    stesso spazio nel flusso del layout, cosi' lo
                    space-y-2.5 della <ul> (10px) resta visivamente
                    invariato e icona/testo non cambiano dimensione.
                    L'espansione (12px) supera di 2px il gap sopra
                    (10px) verso "Support", che non ha padding proprio:
                    overlap minimo alla giunzione, non un vero doppio
                    target — accettabile, non elimina la cliccabilita' di
                    "Support". Ultimo item della lista: nessun vincolo
                    sotto. */}
                <a
                  href={REDDIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta-placement={COMMUNITY_PLACEMENTS.footer}
                  className="inline-flex items-center gap-1.5 py-3 -my-3 text-text-secondary hover:text-text-primary transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua rounded-sm"
                >
                  <RedditIcon className="h-4 w-4 flex-shrink-0" />
                  {dict.footer.links.community}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="text-sm lg:col-span-4">
          <div className="text-text-muted mb-4 tracking-[0.22em] uppercase text-[10px] font-semibold">
            {dict.footer.legal}
          </div>
          <ul className="space-y-2.5">
            <li><Link href={`/${locale}/privacy`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.privacy}</Link></li>
            <li><Link href={`/${locale}/terms`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.terms}</Link></li>
            <li><Link href={`/${locale}/cookies`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.cookies}</Link></li>
            <li><Link href={`/${locale}/imprint`} prefetch={false} className="text-text-secondary hover:text-text-primary transition">{IMPRINT_NAV_LABEL[locale]}</Link></li>
            <li><Link href="/delete-account" prefetch={false} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Elimina account" : "Delete account"}</Link></li>
            <li>
              <a href="mailto:privacy@fitmesh.fit" className="text-text-secondary hover:text-text-primary transition font-mono text-xs">
                privacy@fitmesh.fit
              </a>
            </li>
            <li>
              <a href="mailto:hello@fitmesh.fit" className="text-text-secondary hover:text-text-primary transition font-mono text-xs">
                hello@fitmesh.fit
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} FitMesh Sync. {dict.footer.rights}</span>
          <span className="inline-flex items-center gap-2 text-center">
            <span className="w-1 h-1 rounded-full bg-brand-green animate-pulse motion-reduce:animate-none" />
            {dict.footer.made_with}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span>{dict.footer.fosforonero_label}</span>
            <a
              href="https://www.fosforonero.com"
              target="_blank"
              rel="noopener"
              className="font-medium text-text-secondary hover:text-text-primary transition underline decoration-text-muted/40 underline-offset-2"
            >
              Fosforonero
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
