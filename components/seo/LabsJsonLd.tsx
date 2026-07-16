import { JsonLd } from "./JsonLd";
import { organizationCompactRef } from "./OrganizationJsonLd";
import { authorCompactNode } from "@/lib/seo/entities";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { SITE_URL } from "@/lib/product-facts";

export interface LabsBreadcrumbItem {
  name: string;
  path: string;
}

export interface LabsFaqItem {
  question: string;
  answer: string;
}

export interface LabsToolJsonLdInput {
  locale: "it" | "en";
  /** Path assoluto senza dominio, es. "/it/labs/calcolatore-hrv-rmssd". */
  path: string;
  pageTitle: string;
  pageDescription: string;
  toolName: string;
  toolDescription: string;
  datePublished: string;
  dateModified: string;
  breadcrumb: LabsBreadcrumbItem[];
  faq: LabsFaqItem[];
  ogImagePath: string;
}

/**
 * Un SOLO @graph per pagina Labs (WebPage + WebApplication + BreadcrumbList
 * + FAQPage), come richiesto esplicitamente dallo sprint — diverso dal
 * pattern del resto del sito (script separati per tipo, vedi blog/[slug]).
 * Le FAQ qui DEVONO coincidere con quelle renderizzate visibilmente in
 * pagina: il chiamante passa lo stesso array `faq` usato per il markup
 * visibile, non una copia separata.
 *
 * Deliberatamente NIENTE aggregateRating, review, MedicalWebPage, o
 * risultati individuali — vedi Fase 6 dello sprint.
 */
export function labsToolJsonLdGraph(input: LabsToolJsonLdInput) {
  const url = `${SITE_URL}${input.path}`;
  const lang = schemaLanguage(input.locale);
  const webAppId = `${url}#webapplication`;
  const webPageId = `${url}#webpage`;

  const webPage = {
    "@type": "WebPage",
    "@id": webPageId,
    url,
    name: input.pageTitle,
    description: input.pageDescription,
    inLanguage: lang,
    isPartOf: { "@id": `${SITE_URL}#website` },
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}${input.ogImagePath}`,
      width: 1200,
      height: 630,
    },
    mainEntity: { "@id": webAppId },
    publisher: organizationCompactRef(),
    author: authorCompactNode(),
  };

  const webApplication = {
    "@type": "WebApplication",
    "@id": webAppId,
    name: input.toolName,
    description: input.toolDescription,
    url,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. No installation required.",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    publisher: organizationCompactRef(),
    author: authorCompactNode(),
    dateModified: input.dateModified,
    inLanguage: lang,
  };

  const breadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: input.breadcrumb.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(idx < input.breadcrumb.length - 1 && {
        item: `${SITE_URL}${item.path}`,
      }),
    })),
  };

  const faqPage =
    input.faq.length > 0
      ? {
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: input.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          })),
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@graph": [webPage, webApplication, breadcrumbList, ...(faqPage ? [faqPage] : [])],
  };
}

export function LabsToolJsonLd(props: LabsToolJsonLdInput) {
  return <JsonLd data={labsToolJsonLdGraph(props)} />;
}
