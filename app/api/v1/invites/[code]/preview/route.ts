import { NextResponse } from "next/server";

/**
 * Anteprima di un invito alla Mesh Famiglia: risposta COSTANTE.
 *
 * FIX P0 (29/09/2026): qualunque codice, qualunque richiesta, stessa risposta.
 * Nessun accesso al database, nessuna chiave di servizio, nessuna lettura del
 * codice del percorso. L'handler non riceve nemmeno gli argomenti: non c'e'
 * niente da cui una risposta possa dipendere.
 *
 * Decisione di Matteo (29/09/2026): 404 costante, stesso corpo per qualunque
 * codice e qualunque metodo. Nel repository non risultano chiamanti.
 *
 * Si esporta solo GET. POST, PUT, PATCH e DELETE danno 405, OPTIONS dà 204 con
 * Allow: tutto senza dati e uguale per ogni codice.
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
