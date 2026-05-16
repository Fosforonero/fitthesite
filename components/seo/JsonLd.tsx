/**
 * Componente JSON-LD riusabile. Emette <script type="application/ld+json">
 * con l'oggetto schema serializzato. Pattern Next.js App Router standard.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "...", ... }} />
 *
 * Best practice (vedi articolo didof.dev): usa spread condizionale a monte
 * per evitare proprietà null/undefined nel JSON finale:
 *   const schema = {
 *     "@context": "https://schema.org",
 *     "@type": "Article",
 *     headline: title,
 *     ...(image && { image }),
 *     ...(dateModified && { dateModified }),
 *   }
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
