import React from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";
import {
  ESSENTIAL_GLOSSARY,
  type SupportedMatrixLocale,
} from "@/lib/compatibility/glossary-data";
import { CompatibilityMatrix } from "./CompatibilityMatrix";
import { EssentialGlossary } from "./EssentialGlossary";

interface CompatibilitySectionProps {
  locale: SupportedMatrixLocale;
}

export function CompatibilitySection({ locale }: CompatibilitySectionProps) {
  const glossaryLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${SITE_URL}/${locale}/integrations#glossary`,
    name:
      locale === "it"
        ? "Glossario essenziale della sincronizzazione salute FitMesh"
        : locale === "de"
          ? "Basis-Glossar der FitMesh-Gesundheitssynchronisation"
          : locale === "fr"
            ? "Glossaire essentiel de synchronisation santé FitMesh"
            : "FitMesh Health Sync Essential Glossary",
    inLanguage: schemaLanguage(locale),
    hasDefinedTerm: ESSENTIAL_GLOSSARY.map((item) => ({
      "@type": "DefinedTerm",
      "@id": `${SITE_URL}/${locale}/integrations#term-${item.id}`,
      name: item.term[locale] || item.term.en,
      description: item.definition[locale] || item.definition.en,
      inDefinedTermSet: `${SITE_URL}/${locale}/integrations#glossary`,
    })),
  };

  return (
    <>
      <JsonLd data={glossaryLd} />
      <section
        id="compatibility"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-border-subtle/70"
        aria-labelledby="matrix-heading"
      >
        <CompatibilityMatrix locale={locale} />
        <EssentialGlossary locale={locale} />
      </section>
    </>
  );
}
