import React from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";
import {
  ESSENTIAL_GLOSSARY,
  type SupportedMatrixLocale,
} from "@/lib/compatibility/glossary-data";
import {
  COMPATIBILITY_PATHS,
  UNVERIFIED_COMBINATIONS_MAP,
} from "@/lib/compatibility/matrix-data";
import {
  resolveGuideLink,
  resolveUnverifiedLink,
  type ResolvedMatrixLink,
} from "@/lib/compatibility/matrix-links";
import { CompatibilityMatrix } from "./CompatibilityMatrix";
import { CompatibilitySelector } from "./CompatibilitySelector";
import { EssentialGlossary } from "./EssentialGlossary";
import { buildSelectorGuideLinkMap } from "@/lib/compatibility/selector-links";

interface CompatibilitySectionProps {
  locale: SupportedMatrixLocale;
}

export function CompatibilitySection({ locale }: CompatibilitySectionProps) {
  const isSelectorLocale = locale === "it" || locale === "en";
  const guideLinks = isSelectorLocale ? buildSelectorGuideLinkMap() : undefined;

  const guideLinksByPathId: Record<string, ResolvedMatrixLink | null> = {};
  for (const path of COMPATIBILITY_PATHS) {
    guideLinksByPathId[path.id] = resolveGuideLink(path, locale);
  }

  const unverifiedLinksByProviderSlug: Record<string, ResolvedMatrixLink | null> = {};
  for (const item of Object.values(UNVERIFIED_COMBINATIONS_MAP)) {
    unverifiedLinksByProviderSlug[item.providerSlug] = resolveUnverifiedLink(
      item.providerSlug,
      locale
    );
  }

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
        {isSelectorLocale && guideLinks && (
          <div className="mb-14">
            <CompatibilitySelector locale={locale} guideLinks={guideLinks} />
          </div>
        )}
        <CompatibilityMatrix
          locale={locale}
          guideLinksByPathId={guideLinksByPathId}
          unverifiedLinksByProviderSlug={unverifiedLinksByProviderSlug}
        />
        <EssentialGlossary locale={locale} />
      </section>
    </>
  );
}
