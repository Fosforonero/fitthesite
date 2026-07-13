import type { Metadata } from "next";

import { DeleteAccountView } from "@/components/DeleteAccountView";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { DELETE_ACCOUNT_COPY } from "@/lib/content/delete-account-copy";
import { SITE_URL } from "@/lib/product-facts";

const PAGE_URL = `${SITE_URL}/delete-account`;

/**
 * Pagina pubblica di cancellazione account (requisito Google Play/App Store).
 * Route NON localizzata di proposito: un solo URL, `/delete-account`, mai
 * `/it/delete-account` (vedi middleware.ts `NON_LOCALIZED_PREFIXES`).
 * Lingua di default inglese (Fase 1 spec), italiano disponibile via toggle
 * client-side (`components/DeleteAccountView.tsx`), niente redirect o
 * negoziazione lingua su questa route: sempre la stessa risposta 200 per
 * chiunque, in linea coi requisiti "reachable without installing the app".
 */
export const metadata: Metadata = {
  title: DELETE_ACCOUNT_COPY.en.metaTitle,
  description: DELETE_ACCOUNT_COPY.en.metaDescription,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "FitMesh Sync",
    title: DELETE_ACCOUNT_COPY.en.metaTitle,
    description: DELETE_ACCOUNT_COPY.en.metaDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: DELETE_ACCOUNT_COPY.en.metaTitle,
    description: DELETE_ACCOUNT_COPY.en.metaDescription,
  },
  robots: { index: true, follow: true },
};

export default function DeleteAccountPage() {
  const t = DELETE_ACCOUNT_COPY.en;

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}#webpage`,
    name: t.metaTitle,
    description: t.metaDescription,
    url: PAGE_URL,
    inLanguage: schemaLanguage("en"),
    publisher: organizationCompactRef(),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      { "@type": "ListItem", position: 2, name: t.h1 },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={webPageJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <DeleteAccountView />
    </>
  );
}
