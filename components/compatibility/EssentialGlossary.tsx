import React from "react";
import {
  ESSENTIAL_GLOSSARY,
  type SupportedMatrixLocale,
} from "@/lib/compatibility/glossary-data";

interface EssentialGlossaryProps {
  locale: SupportedMatrixLocale;
}

const SECTION_COPY: Record<
  SupportedMatrixLocale,
  { title: string; subtitle: string; badge: string }
> = {
  it: {
    badge: "Termini e Definizioni",
    title: "Glossario essenziale: i concetti chiave del sync",
    subtitle:
      "Sette definizioni fattuali per comprendere la differenza tra sensori hardware, esportazioni di sistema e letture autorizzate.",
  },
  en: {
    badge: "Terms & Definitions",
    title: "Essential Glossary: Key Concepts of Health Sync",
    subtitle:
      "Seven factual definitions explaining differences between hardware sensors, system exports, and authorized data reads.",
  },
  de: {
    badge: "Begriffe & Definitionen",
    title: "Basis-Glossar: Schlüsselbegriffe der Synchronisation",
    subtitle:
      "Sieben sachliche Definitionen zu den Unterschieden zwischen Hardware-Sensoren, System-Exporten und autorisiertem Auslesen.",
  },
  fr: {
    badge: "Termes et Définitions",
    title: "Glossaire essentiel : les concepts clés du sync",
    subtitle:
      "Sept définitions factuelles pour comprendre la différence entre capteurs physiques, exportations système et lectures autorisées.",
  },
};

export function EssentialGlossary({ locale }: EssentialGlossaryProps) {
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;

  return (
    <section className="mt-16 sm:mt-24" id="glossary" aria-labelledby="glossary-heading">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-block text-[10px] uppercase tracking-[0.24em] font-semibold text-brand-aqua bg-brand-aqua/10 px-3 py-1 rounded-full border border-brand-aqua/20 mb-3">
          {copy.badge}
        </span>
        <h3
          id="glossary-heading"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary"
        >
          {copy.title}
        </h3>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          {copy.subtitle}
        </p>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ESSENTIAL_GLOSSARY.map((item) => (
          <div
            key={item.id}
            id={`term-${item.id}`}
            className="p-5 rounded-2xl bg-surface/60 border border-border-subtle/80 hover:border-brand-aqua/40 transition flex flex-col justify-between"
          >
            <div>
              <dt className="font-display text-base font-semibold text-text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" aria-hidden="true" />
                {item.term[locale] || item.term.en}
              </dt>
              <dd className="mt-2.5 text-xs text-text-secondary leading-relaxed">
                {item.definition[locale] || item.definition.en}
              </dd>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle/40 flex items-center justify-between text-[10px] text-text-muted">
              <span>FitMesh Standard</span>
              <code>#{item.id}</code>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
