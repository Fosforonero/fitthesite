export interface LabsSource {
  title: string;
  authorOrOrg: string;
  year: string;
  url: string;
  verifiedOn: string;
}

/**
 * Elenco fonti: ogni voce ha titolo, ente/autori, anno, link e data
 * dell'ultima verifica (requisito esplicito Fase 4 "Fonti minime").
 */
export function LabsSources({ heading, items }: { heading: string; items: LabsSource[] }) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
      <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
        {heading}
      </h2>
      <ol className="mt-4 space-y-3">
        {items.map((s, i) => (
          <li key={i} className="text-sm text-text-secondary leading-relaxed">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-brand-aqua hover:underline"
            >
              {s.title}
            </a>
            {": "}
            {s.authorOrOrg}, {s.year}.{" "}
            <span className="text-text-muted">
              {s.verifiedOn}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
