export interface LabsFaqEntry {
  question: string;
  answer: string;
}

/**
 * FAQ visibile: usa lo stesso array passato al JSON-LD FAQPage
 * (`labsToolJsonLdGraph`), così i due non possono mai divergere. Vedi
 * requisito Fase 6 "Le FAQ nel JSON-LD devono essere identiche alle FAQ
 * visibili".
 */
export function LabsFaq({ heading, items }: { heading: string; items: LabsFaqEntry[] }) {
  if (items.length === 0) return null;
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
      <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
        {heading}
      </h2>
      <div className="mt-6 space-y-4">
        {items.map((f, i) => (
          <details
            key={i}
            className="card p-5 group [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
              <span>{f.question}</span>
              <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
