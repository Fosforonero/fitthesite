import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { invitoBlocchi, invitoMetadati } from "@/lib/content/famiglia-invito";
import { locales, type Locale } from "@/lib/i18n";

/**
 * Pagina pubblica di un link d'invito alla Mesh Famiglia.
 *
 * Fix P0 (29/09/2026): la pagina non legge piu' niente ed e' uguale per
 * qualunque codice (valido, scaduto, esaurito, inesistente, malformato).
 *   - nessuna lettura del database e nessuna chiave di servizio;
 *   - nessuna lettura di sessione o cookie;
 *   - il parametro `code` del percorso non viene mai letto: non puo' comparire
 *     nel testo, nei metadati o nei link;
 *   - nessun nome di gruppo o di chi invita, nessun conteggio, nessuna promessa
 *     di condivisione;
 *   - nessun pulsante o link per accettare o installare tramite il codice.
 *
 * Il testo e' quello deciso da Matteo, vedi lib/content/famiglia-invito.ts.
 * Quando la Mesh verra' accesa servira' la pagina definitiva, non un ritorno
 * alla lettura del database da qui.
 *
 * PERIMETRO: questo file non legge il database. Il middleware continua a chiamare il
 * rate limit per questa rotta (rate_limit_check con l'IP nella chiave, fail-open): non
 * e' toccato qui. Non risolve le RPC di invito, le policy cross-utente ne' il kill switch.
 *
 * Il test statico test/invito-pubblico-senza-database.test.ts tiene questo
 * file e la route di anteprima lontani da Supabase.
 */

// Sempre dinamica: mai generata in fase di build, mai messa in cache.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  // Si legge solo la lingua. Il codice resta fuori dai metadati.
  const { locale } = await params;
  const { title, description } = invitoMetadati(locale);
  return {
    title,
    description,
    robots: { index: false, follow: false },
    // Niente canonical ne' alternate: la pagina non e' un contenuto da indicizzare.
    alternates: {},
    openGraph: { type: "website", siteName: "FitMesh Sync", title, description },
    twitter: { card: "summary", title, description },
  };
}

export default async function JoinFamilyPage({ params }: Params) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  return (
    <main className="mx-auto max-w-md px-6 py-12 space-y-8">
      {invitoBlocchi(locale).map((blocco, i) => {
        const Titolo = i === 0 ? "h1" : "h2";
        return (
          <section key={blocco.lang} lang={blocco.lang}>
            <Titolo className="text-3xl font-semibold mb-4">{blocco.nome}</Titolo>
            <p>{blocco.testo}</p>
          </section>
        );
      })}
    </main>
  );
}
