import Link from "next/link";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import HeroVisual from "@/components/HeroVisual";
import PlayStoreButton from "@/components/PlayStoreButton";

const KPI_COLORS = ["#1DA1FF", "#FF5C7A", "#A78BFA", "#FFB547", "#7CFF5B", "#38BDF8"];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const playLabels =
    lc === "en"
      ? { small: "GET IT ON", store: "Google Play", soon: "Coming Soon" }
      : { small: "Disponibile su", store: "Google Play", soon: "In arrivo" };

  return (
    <>
      {/* Hero — 2 columns on lg+ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left: text & CTAs */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border border-divider bg-bg-secondary/40 text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {t.hero.badge}
            </div>

            <h1 className="mt-6 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-2xl">
              {t.hero.heading_1}
              <br className="hidden sm:inline" />{" "}
              <span className="text-brand-gradient">{t.hero.heading_accent}</span>
            </h1>

            <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
              {t.hero.description}
            </p>

            <div id="download" className="mt-8 flex flex-wrap items-center gap-3">
              <PlayStoreButton
                disabled
                comingSoonLabel={playLabels.soon}
                smallLabel={playLabels.small}
                storeLabel={playLabels.store}
              />
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
              >
                {t.hero.cta_secondary}
              </a>
            </div>

            <p className="mt-5 text-xs text-text-muted">{t.hero.pricing}</p>
          </div>

          {/* Right: phone mockup */}
          <div className="lg:col-span-5">
            <HeroVisual locale={lc} />
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
            <PlayStoreButton
              disabled
              comingSoonLabel={playLabels.soon}
              smallLabel={playLabels.small}
              storeLabel={playLabels.store}
            />
          </div>
        </div>
      </section>
    </>
  );
}
