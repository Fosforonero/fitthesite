/**
 * Helper generico per il completeness-gate SEO di pagine statiche che usano
 * la forma "un solo oggetto COPY: Record<localeSubset, {...campi...}>".
 *
 * Gemello minimale di `lib/blog/indexability.ts` e `lib/landing/indexability.ts`,
 * ma per pagine che NON hanno un modello dati condiviso (post/landing): qui
 * l'unica fonte di verità sul "questo locale è tradotto?" è la presenza della
 * chiave stessa nell'oggetto COPY (`press/page.tsx`, `famiglia/page.tsx`), che
 * oggi già fanno `const copyKey = (lc in COPY ? lc : "en") as keyof typeof COPY`
 * per scegliere il body copy — ma senza mai riflettere quel fallback nei
 * `robots` meta. Risultato: locali assenti da COPY mostrano contenuto EN
 * silenzioso sotto un URL non-EN, self-canonicalizzato → duplicato.
 *
 * Uso in `generateMetadata`:
 *   robots: isLocaleInCopy(COPY, lc) ? undefined : { index: false, follow: false }
 *
 * `T` è inferito dal `COPY` passato (tipizzato via `as const`), quindi il
 * risultato è un vero type guard: dopo il check, `lc` è ristretto alle chiavi
 * realmente presenti in quello specifico oggetto COPY.
 */
export function isLocaleInCopy<T extends Record<string, unknown>>(
  copy: T,
  locale: string,
): locale is Extract<keyof T, string> {
  return locale in copy;
}
