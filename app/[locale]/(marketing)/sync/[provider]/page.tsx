import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import PlayStoreButton from "@/components/PlayStoreButton";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import {
  PROVIDERS,
  PROVIDERS_BY_SLUG,
  categoryLabel,
  statusLabel,
  type Provider,
} from "@/lib/providers/data";

const SITE_URL = "https://www.fitmesh.fit";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";
const WAITLIST_EMAIL = "waitlist@fitmesh.fit";

export function generateStaticParams() {
  return PROVIDERS.flatMap((p) =>
    locales.map((locale) => ({ locale, provider: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}): Promise<Metadata> {
  const { locale, provider } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  const p = PROVIDERS_BY_SLUG[provider];
  if (!p) return {};

  const title =
    lc === "it"
      ? `Sincronizza ${p.name} a FitMesh — Dashboard salute personale`
      : `Sync ${p.name} to FitMesh — Personal Health Dashboard`;
  const description = p.tagline[lc];

  const path = `/${lc}/sync/${p.slug}`;
  return {
    title,
    description,
    keywords: p.seoKeywords[lc].join(", "),
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/sync/${p.slug}`,
        en: `${SITE_URL}/en/sync/${p.slug}`,
        "x-default": `${SITE_URL}/it/sync/${p.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProviderLanding({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}) {
  const { locale, provider } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const p = PROVIDERS_BY_SLUG[provider];
  if (!p) notFound();

  // "isLive" = CTA primaria è Play Store. Sia `live` (nativo) sia `live-basic`
  // (via HC) sono usabili oggi → entrambi mostrano il bottone Play Store.
  const isLive = p.status === "live" || p.status === "live-basic";
  const isLiveBasic = p.status === "live-basic";
  const status = statusLabel(p.status, lc);
  const category = categoryLabel(p.category, lc);

  const t = (it: string, en: string) => (lc === "it" ? it : en);

  // ── JSON-LD ──────────────────────────────────────────────────────────
  const path = `/${lc}/sync/${p.slug}`;
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `FitMesh Sync — ${p.name}`,
    applicationCategory: "HealthApplication",
    operatingSystem: "ANDROID",
    description: p.longDesc[lc],
    url: `${SITE_URL}${path}`,
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    offers: { "@type": "Offer", price: "3.99", priceCurrency: "EUR" },
    downloadUrl: PLAY_URL,
  };

  const faqLd =
    p.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: p.faqs.map((f) => ({
            "@type": "Question",
            name: f.q[lc],
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a[lc],
            },
          })),
        }
      : null;

  // ── UI ───────────────────────────────────────────────────────────────
  const relatedProviders = PROVIDERS.filter(
    (x) => x.slug !== p.slug && x.category === p.category,
  ).slice(0, 3);

  const waitlistSubject = encodeURIComponent(
    lc === "it"
      ? `Waitlist ${p.name} — FitMesh Sync`
      : `Waitlist ${p.name} — FitMesh Sync`,
  );
  const waitlistBody = encodeURIComponent(
    lc === "it"
      ? `Ciao!\n\nVoglio essere avvisato/a quando l'integrazione con ${p.name} sarà disponibile.\n\nLa mia email:\n`
      : `Hi!\n\nPlease notify me when the ${p.name} integration becomes available.\n\nMy email:\n`,
  );
  const waitlistHref = `mailto:${WAITLIST_EMAIL}?subject=${waitlistSubject}&body=${waitlistBody}`;

  return (
    <>
      <JsonLd data={softwareLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Breadcrumbs
        items={[
          { name: t("Integrazioni", "Integrations"), path: `/${lc}/integrations` },
          { name: p.name, path },
        ]}
        locale={lc}
      />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border text-xs font-medium"
                style={{
                  borderColor: `${status.color}55`,
                  background: `${status.color}11`,
                  color: status.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }}
                />
                {status.text}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-pill border border-divider bg-bg-secondary/40 text-xs text-text-secondary">
                {category}
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{p.vendor}</span>
            </div>

            <h1 className="mt-5 font-display text-display-xl font-semibold tracking-tightest text-text-primary">
              {t(`Sincronizza ${p.name}`, `Sync ${p.name}`)}{" "}
              <span className="text-brand-gradient">
                {t("alla tua dashboard", "to your dashboard")}
              </span>
            </h1>

            <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
              {p.longDesc[lc]}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isLive ? (
                <PlayStoreButton
                  disabled
                  comingSoonLabel={t("In arrivo", "Coming Soon")}
                  smallLabel={t("Disponibile su", "GET IT ON")}
                  storeLabel="Google Play"
                />
              ) : (
                <a
                  href={waitlistHref}
                  className="inline-flex items-center px-5 py-3 rounded-pill btn-cta text-sm font-semibold"
                >
                  {t("Avvisami al lancio", "Get notified at launch")}
                </a>
              )}
              {isLiveBasic && (
                <a
                  href={waitlistHref}
                  className="inline-flex items-center px-5 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
                >
                  {t("Avvisami per i dati avanzati", "Notify me for advanced data")}
                </a>
              )}
              {!isLiveBasic && (
                <Link
                  href={`/${lc}/integrations`}
                  className="inline-flex items-center px-5 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
                >
                  {t("Vedi tutte le integrazioni", "See all integrations")}
                </Link>
              )}
            </div>

            <p className="mt-5 text-xs text-text-muted max-w-md">
              {t(
                "FitMesh Sync è un prodotto indipendente. I marchi citati appartengono ai rispettivi proprietari e questa pagina non implica affiliazione o sponsorizzazione.",
                "FitMesh Sync is an independent product. Trademarks belong to their respective owners; this page implies no affiliation or sponsorship.",
              )}
            </p>
          </div>

          {/* Provider monogram card */}
          <div className="lg:col-span-5">
            <div className="card p-10 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
                style={{ background: p.brandColor }}
              />
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center font-display text-5xl font-bold text-white relative"
                style={{
                  background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}cc)`,
                  boxShadow: `0 16px 40px -16px ${p.brandColor}88`,
                }}
              >
                {p.initial}
              </div>
              <p className="mt-6 font-display text-2xl font-semibold text-text-primary relative">
                {p.name}
              </p>
              <p className="mt-1 text-sm text-text-muted relative">{p.vendor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* DATA TYPES GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {t("Dati supportati", "Supported data")}
        </h2>
        <p className="mt-2 text-text-secondary max-w-2xl">
          {t(
            "I tipi di dato che FitMesh può leggere da questa integrazione. Pallino verde = supportato, grigio = non disponibile da questa fonte.",
            "The data types FitMesh can read from this integration. Green dot = supported, grey = not available from this source.",
          )}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {p.dataTypes.map((d) => (
            <div
              key={d.key}
              className={`card p-4 flex items-center gap-3 ${
                d.supported ? "" : "opacity-50"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: d.supported ? "#31E981" : "#556078",
                  boxShadow: d.supported ? "0 0 10px #31E98155" : "none",
                }}
              />
              <span className="text-sm text-text-primary">{d.label[lc]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE-BASIC: cosa funziona oggi / cosa aggiungerà OAuth */}
      {isLiveBasic && p.viaHC && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Cosa funziona OGGI */}
            <div className="rounded-card border border-divider bg-gradient-to-br from-success/5 to-bg-card p-6 sm:p-8 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl bg-success"
              />
              <div className="relative">
                <p className="text-[10px] uppercase tracking-[0.22em] text-success font-semibold">
                  {t("Funziona oggi", "Works today")}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {t(
                    "Via Health Connect, senza configurazione extra",
                    "Via Health Connect, no extra setup",
                  )}
                </h2>
                <ul className="mt-5 space-y-2">
                  {p.viaHC.worksNow[lc].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cosa AGGIUNGERÀ l'OAuth */}
            <div className="rounded-card border border-divider bg-gradient-to-br from-brand-aqua/5 to-bg-card p-6 sm:p-8 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl bg-brand-aqua"
              />
              <div className="relative">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                  {t(
                    `OAuth ufficiale — ${p.viaHC.oauthEta[lc]}`,
                    `Official OAuth — ${p.viaHC.oauthEta[lc]}`,
                  )}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {t("Cosa aggiungerà l'integrazione diretta", "What the direct integration will add")}
                </h2>
                <ul className="mt-5 space-y-2">
                  {p.viaHC.oauthAdds[lc].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="text-brand-aqua mt-0.5 flex-shrink-0">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={waitlistHref}
                  className="mt-6 inline-flex items-center text-xs text-brand-aqua hover:text-brand-green transition"
                >
                  {t("Avvisami quando disponibile →", "Notify me when available →")}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TECH NOTE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t("Nota tecnica", "Technical note")}
          </p>
          <p className="mt-3 text-text-secondary leading-relaxed">{p.techNote[lc]}</p>
        </div>
      </section>

      {/* FAQ */}
      {p.faqs.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t("Domande frequenti", "Frequently asked questions")}
          </h2>
          <div className="mt-8 space-y-4">
            {p.faqs.map((f, i) => (
              <details
                key={i}
                className="card p-5 group [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
                  <span>{f.q[lc]}</span>
                  <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">{f.a[lc]}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* RELATED */}
      {relatedProviders.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t("Anche queste integrazioni", "Related integrations")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {relatedProviders.map((r) => (
              <Link
                key={r.slug}
                href={`/${lc}/sync/${r.slug}`}
                className="card p-5 hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display text-base font-bold text-white"
                    style={{ background: r.brandColor }}
                  >
                    {r.initial}
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-muted">{statusLabel(r.status, lc).text}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {isLive
            ? t("Pronto a iniziare?", "Ready to start?")
            : t("Vuoi essere avvisato?", "Want to be notified?")}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {isLive
            ? t(
                "Scarica FitMesh Sync, autorizza Health Connect, e in 30 secondi i tuoi dati sono live.",
                "Download FitMesh Sync, grant Health Connect permissions, and your data is live in 30 seconds.",
              )
            : t(
                `Lascia la tua email e ti avvisiamo non appena l'integrazione ${p.name} sarà disponibile. Niente newsletter, niente spam — solo l'annuncio.`,
                `Drop your email and we'll notify you as soon as the ${p.name} integration lands. No newsletter, no spam — just the announcement.`,
              )}
        </p>
        <div className="mt-8 flex justify-center">
          {isLive ? (
            <PlayStoreButton
              disabled
              comingSoonLabel={t("In arrivo", "Coming Soon")}
              smallLabel={t("Disponibile su", "GET IT ON")}
              storeLabel="Google Play"
            />
          ) : (
            <a
              href={waitlistHref}
              className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
            >
              {t("Avvisami al lancio", "Get notified at launch")}
            </a>
          )}
        </div>
      </section>
    </>
  );
}
