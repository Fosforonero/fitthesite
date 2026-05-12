import type { ReactNode } from "react";

export function LegalPage({
  kicker,
  title,
  lastUpdated,
  children,
}: {
  kicker: string;
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-3 text-sm text-text-muted">{lastUpdated}</p>
      </header>

      <div className="space-y-10 text-text-secondary leading-relaxed">{children}</div>

      <hr className="my-12 border-divider" />
      <p className="text-center text-xs text-text-muted">
        © {new Date().getFullYear()} FitMesh Sync.
      </p>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-text-primary border-b border-divider pb-3 mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function List({ items }: { items: Array<[string, string]> }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map(([term, def]) => (
        <li key={term} className="flex gap-2">
          <span className="text-brand-aqua mt-0.5">•</span>
          <span>
            <strong className="text-text-primary">{term}:</strong>{" "}
            <span className="text-text-secondary">{def}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Callout({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "warning";
}) {
  const tone =
    variant === "warning"
      ? "border-warning bg-warning/10"
      : "border-brand-aqua bg-brand-aqua/10";
  return (
    <div className={`mt-4 rounded-[14px] border-l-4 ${tone} px-5 py-4 text-sm text-text-secondary`}>
      {children}
    </div>
  );
}
