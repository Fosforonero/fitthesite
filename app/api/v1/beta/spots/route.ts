/**
 * Tombstone statica per /api/v1/beta/spots.
 *
 * L'endpoint (contatore "posti Founder occupati") e' stato rimosso in
 * Hotfix P0.6C perche' il conteggio pubblico (fermo a 705) non era
 * riconciliato con i grant realmente assegnati in produzione — vedi
 * `CAPABILITY_STATUS.founderAutoGrant.note` in lib/product-facts.ts.
 *
 * Cancellare del tutto il file (invece di sostituirlo con una tombstone)
 * causava pero' un 500, non un 404: Next.js fa ricadere il path scoperto
 * sul catch-all di PayloadCMS (app/(payload)/api/[...slug]/route.ts), che
 * prova a inizializzare Payload/Postgres per QUALSIASI path non
 * riconosciuto e fallisce senza un PAYLOAD_SECRET/DB reali.
 *
 * Questa route e' statica e piu' specifica del catch-all dinamico, quindi
 * Next.js la fa vincere sempre nel routing: intercetta il path prima che
 * arrivi a Payload e risponde 404 in modo deterministico, senza toccare
 * Supabase, Payload o alcun database — anche in un ambiente Docker bare
 * senza segreti.
 *
 * Non reintrodurre qui alcuna query, alcun campo di conteggio (taken/
 * total) o alcun import di Supabase/Payload: il guardrail
 * founder:counter-check (tools/check-founder-counter-removed.ts) fallisce
 * se questo file smette di essere una tombstone pura.
 */
import { NextResponse } from "next/server";

const CACHE_CONTROL = "public, max-age=86400, immutable";

function tombstone() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    },
  );
}

export const GET = tombstone;
export const POST = tombstone;
export const PUT = tombstone;
export const PATCH = tombstone;
export const DELETE = tombstone;
export const OPTIONS = tombstone;
export const HEAD = tombstone;
