import { NextResponse } from "next/server";

/**
 * Anteprima di un invito alla Mesh Famiglia: risposta COSTANTE.
 *
 * FIX P0 (29/09/2026): qualunque codice, qualunque richiesta, stessa risposta.
 * Nessun accesso al database, nessuna chiave di servizio, nessuna lettura del
 * codice del percorso. L'handler non riceve nemmeno gli argomenti: non c'e'
 * niente da cui una risposta possa dipendere.
 *
 * Decisione 49 di Matteo (29/09/2026): 404 costante, stesso contenuto per
 * qualunque codice, senza accesso al database. Nel repository non risultano
 * chiamanti.
 *
 * Si esporta solo GET: per gli altri metodi risponde il framework (405, e OPTIONS
 * 204 con Allow), senza dati e uguale per ogni codice.
 *
 * PERIMETRO: questo file non legge il database. NON e' una correzione del
 * middleware: per questa rotta il middleware continua a chiamare il rate limit
 * (rate_limit_check con l'IP nella chiave, fail-open). Non risolve nemmeno le RPC di
 * invito, le policy cross-utente o il kill switch: sono lotti separati.
 *
 * Il test statico test/invito-pubblico-senza-database.test.ts tiene questo
 * file lontano da Supabase.
 */

// Mai prerenderizzata, mai messa in cache.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "not_available" },
    {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    },
  );
}
