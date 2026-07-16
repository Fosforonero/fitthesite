import Link from "next/link";

/**
 * Blocchi presentazionali condivisi fra le pagine `/labs` e `/labs/[tool]`.
 * Nessuno di questi componenti tocca rete/analytics/storage: sono puro
 * markup server-rendered (a parte dove esplicitamente notato "use client"
 * in file separati, es. HrvRmssdCalculator).
 */

export function LabsBreadcrumbNav({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden className="text-text-muted/50">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-aqua transition">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-secondary">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function LabsHero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <div
        aria-hidden
        className="halo-conic absolute left-1/2 top-0 -z-10 h-[320px] w-[520px] -translate-x-1/2 opacity-30"
      />
      <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
        {kicker}
      </p>
      <h1 className="mt-3 font-display text-display-xl font-semibold tracking-tightest text-text-primary leading-[1.1]">
        {title}
      </h1>
      <p className="mt-5 text-lg text-text-secondary leading-relaxed max-w-2xl">
        {subtitle}
      </p>
    </header>
  );
}

/**
 * Blocco "risposta diretta" subito sotto l'H1: la prima cosa leggibile
 * server-side, prima e senza bisogno dell'area interattiva. Fondamentale
 * per GEO (un assistente AI che legge solo l'HTML statico trova comunque
 * una risposta completa) e per utenti con JS disabilitato/lento.
 */
export function LabsDirectAnswer({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-card border border-brand-aqua/25 bg-gradient-to-br from-brand-aqua/[0.08] via-bg-card to-bg-card p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-brand-aqua/10 blur-3xl"
        />
        <div className="relative text-text-secondary leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LabsProseSection({
  heading,
  children,
  headingLevel = "h2",
}: {
  heading: string;
  children: React.ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
      <Heading
        className={
          headingLevel === "h2"
            ? "font-display text-display font-semibold tracking-tightest text-text-primary"
            : "font-display text-xl font-semibold text-text-primary"
        }
      >
        {heading}
      </Heading>
      <div className="mt-4 text-text-secondary leading-relaxed space-y-4 [&_strong]:text-text-primary [&_strong]:font-medium">
        {children}
      </div>
    </section>
  );
}

export function LabsRevisionFooter({
  label,
  methodologyVersion,
  reviewedLabel,
  reviewedDate,
  methodologyLabel,
}: {
  label: string;
  methodologyVersion: string;
  reviewedLabel: string;
  reviewedDate: string;
  methodologyLabel: string;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
      <div className="rounded-card border border-divider bg-bg-card/40 p-4 text-xs text-text-muted flex flex-wrap gap-x-6 gap-y-1">
        <span>
          {methodologyLabel}: <strong className="text-text-secondary font-medium">{methodologyVersion}</strong>
        </span>
        <span>
          {reviewedLabel}: <strong className="text-text-secondary font-medium">{reviewedDate}</strong>
        </span>
        <span className="text-text-muted/70">{label}</span>
      </div>
    </div>
  );
}

export function LabsRelatedTools({
  heading,
  items,
}: {
  heading: string;
  items: { name: string; description: string; href?: string; badge?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
      <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
        {heading}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => {
          const inner = (
            <div className="h-full rounded-card border border-divider bg-bg-card/40 p-5 hover:border-brand-aqua/30 transition">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-text-primary">{item.name}</p>
                {item.badge && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-pill border border-divider text-text-muted">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {item.description}
              </p>
            </div>
          );
          return item.href ? (
            <Link key={i} href={item.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}

export function LabsCta({
  heading,
  body,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
      <div className="rounded-card border border-brand-aqua/25 bg-gradient-to-br from-brand-aqua/[0.08] via-bg-card to-bg-card p-6 sm:p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          {heading}
        </h2>
        <p className="mt-2 text-text-secondary leading-relaxed max-w-xl mx-auto">
          {body}
        </p>
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center justify-center rounded-pill bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-[#050816] hover:opacity-90 transition"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
