import Link from "next/link";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import HeroVisual from "@/components/HeroVisual";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import HeroBetaCTA from "@/components/HeroBetaCTA";
import { PROVIDERS, statusLabel } from "@/lib/providers/data";

const KPI_COLORS = ["#1DA1FF", "#FF5C7A", "#A78BFA", "#FFB547", "#7CFF5B", "#38BDF8"];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);

  return (
    <>
      {/* Hero — 2 columns on lg+. Subtle grid pattern in background per profondita'. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-grid-soft opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute -top-32 right-[10%] w-[500px] h-[500px] rounded-full bg-brand-aqua/8 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute top-[300px] -left-32 w-[400px] h-[400px] rounded-full bg-brand-blue/8 blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left: text & CTAs */}
            <div className="lg:col-span-7">
              <span className="eyebrow text-success">
                {t.hero.badge}
              </span>

              <h1 className="mt-7 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-2xl leading-[1.02]">
                {t.hero.heading_1}
                <br className="hidden sm:inline" />{" "}
                <span className="text-brand-gradient">{t.hero.heading_accent}</span>
              </h1>

              <p className="mt-7 text-lg sm:text-xl text-text-secondary max-w-xl leading-relaxed">
                {t.hero.description}
              </p>

              {/* Primary CTA: pre-launch e' il beta program. Quando Play Store
                  e' live in produzione, ripristina StoreButtonsRow come primary. */}
              <div className="mt-10">
                <HeroBetaCTA locale={lc} />
              </div>

              <div id="download" className="mt-7 flex flex-wrap items-center gap-3">
                <StoreButtonsRow locale={lc} />
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full btn-secondary text-sm"
                >
                  {t.hero.cta_secondary}
                </a>
              </div>

              <p className="mt-6 text-xs text-text-muted">{t.hero.pricing}</p>
            </div>

            {/* Right: phone mockup */}
            <div className="lg:col-span-5">
              <HeroVisual locale={lc} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pt-12">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t.features.kicker}
          </p>
          <h2 className="mt-3 font-display text-display font-semibold tracking-tightest text-text-primary">
            {t.features.heading}
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f: { title: string; desc: string }, i: number) => (
            <article
              key={f.title}
              className="card p-6 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{
                  background: KPI_COLORS[i % KPI_COLORS.length],
                  boxShadow: `0 0 14px ${KPI_COLORS[i % KPI_COLORS.length]}55`,
                }}
              />
              <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Integrations strip — drives SEO to /sync/[provider] landings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-24">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
              {lc === "it" ? "Integrazioni" : "Integrations"}
            </p>
            <h2 className="mt-3 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl">
              {lc === "it"
                ? "Funziona con quello che hai già."
                : "Works with what you already have."}
            </h2>
          </div>
          <Link
            href={`/${lc}/integrations`}
            className="text-sm text-brand-aqua hover:text-brand-green transition"
          >
            {lc === "it" ? "Vedi tutte →" : "See all →"}
          </Link>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {PROVIDERS.map((p) => {
            const st = statusLabel(p.status, lc);
            return (
              <Link
                key={p.slug}
                href={`/${lc}/sync/${p.slug}`}
                className="card p-4 hover:-translate-y-0.5 transition-transform flex flex-col items-center text-center gap-2"
              >
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center font-display text-base font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}cc)`,
                    boxShadow: `0 6px 16px -8px ${p.brandColor}88`,
                  }}
                >
                  {p.initial}
                </span>
                <p className="text-xs font-medium text-text-primary leading-tight">
                  {p.name}
                </p>
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold"
                  style={{ color: st.color }}
                >
                  {st.text}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Privacy first */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-24">
        <div className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8 sm:p-12 shadow-card overflow-hidden relative">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--fm-gradient-brand)" }}
          />
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold relative">
            {t.privacy_block.kicker}
          </p>
          <h2 className="mt-3 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl relative">
            {t.privacy_block.heading}
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed relative">
            {t.privacy_block.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3 relative">
            <Link
              href={`/${lc}/privacy`}
              className="inline-flex px-5 py-2.5 rounded-pill border border-divider text-sm text-text-primary hover:bg-white/5 transition"
            >
              {t.privacy_block.cta}
            </Link>
            <a
              href="mailto:privacy@fitmesh.fit"
              className="inline-flex px-5 py-2.5 rounded-pill text-sm text-text-secondary hover:text-text-primary transition"
            >
              privacy@fitmesh.fit
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-24 mb-16">
        <div className="text-center">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t.final_cta.heading}
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            {t.final_cta.description}
          </p>
          <div className="mt-8 flex justify-center">
            <StoreButtonsRow locale={lc} className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}
