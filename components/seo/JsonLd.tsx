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

/**
 * `JSON.stringify` non esegue escape di `<`: una stringa proveniente dal CMS
 * o da contenuto editoriale (es. una FAQ answer, una bio, una meta
 * description) che contenesse letteralmente `</script>` chiuderebbe il tag e
 * inietterebbe markup/script arbitrario nella pagina. `<` è
 * un'escape JSON valida — `JSON.parse`/i parser structured-data di
 * Google la decodificano correttamente in "<" — ma non è interpretabile
 * dall'HTML parser come apertura di un nuovo tag, quindi neutralizza
 * `</script>` (e qualunque altro `<...>`) senza rompere il JSON.
 */
function safeJsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdString(data) }}
    />
  );
}
