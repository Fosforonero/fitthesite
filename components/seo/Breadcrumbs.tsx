import type { Locale } from "@/lib/i18n";
import { JsonLd } from "./JsonLd";

const SITE_URL = "https://www.fitmesh.fit";

export interface BreadcrumbItem {
  /** Etichetta visibile (es. "Privacy") */
  name: string;
  /** Path relativo (es. "/it/privacy"); il dominio viene aggiunto a runtime */
  path: string;
}

/**
 * Emette un JSON-LD `BreadcrumbList` per la pagina corrente. Solo schema
 * (no UI). Il primo elemento è sempre Home, l'ultimo è la pagina corrente
 * (per cui `item` è omesso come da spec Google).
 *
 * Usage in una page.tsx:
 *   <Breadcrumbs items={[
 *     { name: "Privacy", path: `/${lc}/privacy` }
 *   ]} locale={lc} />
 *
 * Il prefix Home è auto-inserito; passa solo i livelli dopo la root.
 */
export function Breadcrumbs({
  items,
  locale,
}: {
  items: BreadcrumbItem[];
  locale: Locale;
}) {
  const homeName = locale === "it" ? "Home" : "Home";
  const all: BreadcrumbItem[] = [
    { name: homeName, path: `/${locale}` },
    ...items,
  ];

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      // L'ultimo elemento (pagina corrente) omette `item` come da spec Google
      ...(idx < all.length - 1 && { item: `${SITE_URL}${it.path}` }),
    })),
  };

  return <JsonLd data={data} />;
}
