/**
 * POST /api/v1/auth/forgot-password — Hotfix P0.10R.
 *
 * Perche' esiste un endpoint nostro invece di chiamare Supabase dal browser:
 * il rate limit deve stare SERVER-side. Un limite applicato nel client (o
 * peggio, un bottone disabilitato) non protegge nulla — chiunque puo'
 * chiamare l'API di Supabase direttamente con curl, floodare la casella di
 * una vittima e bruciare la quota di invio del progetto.
 *
 * REGOLA CENTRALE: per ogni esito NON malformato — indirizzo esistente,
 * inesistente, limite superato, errore di Supabase, configurazione mancante
 * — questa route restituisce la stessa identica risposta pubblica: stesso
 * status, stesso Content-Type, stesso corpo, nessun header `Retry-After` o
 * `X-RateLimit-*`. `buildRateLimitResponse()` NON viene usata di proposito:
 * il suo 429 renderebbe il rate limit osservabile, e distinguere gli esiti
 * trasformerebbe l'endpoint in un oracolo per sapere chi ha un account.
 *
 * Le uniche risposte diverse sono per richieste malformate (metodo, header,
 * corpo, email sintatticamente invalida): li' non c'e' nulla da rivelare su
 * nessun account, e un 4xx aiuta a diagnosticare un bug del client.
 */
import {
  limitForgotPasswordByEmail,
  limitForgotPasswordByIp,
} from '@/lib/rate-limit/limiter';
import { createRecoveryClient } from '@/lib/supabase/recovery-client';
import { locales } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Limite di forma, non di sicurezza: un'email reale non arriva a 254. */
const MAX_EMAIL_LENGTH = 254;
/** Corpo atteso: due campi corti. Oltre questo e' rumore o abuso. */
const MAX_BODY_BYTES = 2_048;
/**
 * Durata minima comune a TUTTI gli esiti. Serve a evitare che il percorso
 * rate-limited (che non chiama Supabase) sia macroscopicamente piu' veloce
 * di quello normale, rendendo il limite osservabile a cronometro.
 *
 * Non e' una difesa da timing attack al microsecondo (sarebbe inutile su
 * rete pubblica e produrrebbe test fragili): livella solo la differenza
 * grossolana fra "ha fatto un round-trip a Supabase" e "non ha fatto
 * nulla". Il jitter evita che il valore fisso diventi esso stesso una firma.
 *
 * Impatto Fluid CPU: `setTimeout` in una Promise NON consuma CPU attiva —
 * la funzione resta in attesa, non in esecuzione. Nessun busy-wait.
 */
const MIN_RESPONSE_MS = 350;
const JITTER_MS = 120;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Risposta neutra: identica per ogni esito non-malformato. */
function neutralResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // La risposta e' sempre uguale, ma la RICHIESTA contiene un indirizzo
      // email: nessun livello intermedio deve conservarne traccia.
      'Cache-Control': 'no-store',
    },
  });
}

async function settleMinimumDuration(startedAt: number): Promise<void> {
  const target = MIN_RESPONSE_MS + Math.random() * JITTER_MS;
  const elapsed = Date.now() - startedAt;
  if (elapsed >= target) return;
  await new Promise((resolve) => setTimeout(resolve, target - elapsed));
}

export async function POST(req: Request): Promise<Response> {
  const startedAt = Date.now();

  // Solo JSON: un form-encoded o un text/plain qui indica un client che non
  // stiamo servendo, oppure un tentativo di aggirare la CORS preflight.
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonError(415, 'unsupported_media_type');
  }

  // Tetto sul corpo prima ancora di leggerlo, quando il client dichiara la
  // lunghezza. Il controllo reale sulla stringa letta resta sotto: un
  // `Content-Length` assente o mentito non deve poter aggirare il limite.
  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonError(413, 'payload_too_large');
  }

  let email: string;
  let requestedLocale: string;

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return jsonError(413, 'payload_too_large');

    const body = JSON.parse(raw) as { email?: unknown; locale?: unknown };
    email = typeof body.email === 'string' ? body.email.trim() : '';
    requestedLocale = typeof body.locale === 'string' ? body.locale : 'en';
  } catch {
    return jsonError(400, 'invalid_body');
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return jsonError(400, 'invalid_email');
  }

  // La locale arriva dal client e NON e' fidata: viene accettata solo se e'
  // una delle 15 reali, altrimenti si ricade su 'en'. Il redirectTo viene
  // poi costruito interamente server-side su un host fisso — il client non
  // puo' in alcun modo proporre un URL, quindi non esiste open redirect.
  const safeLocale = (locales as readonly string[]).includes(requestedLocale)
    ? requestedLocale
    : 'en';

  // Entrambi i bucket sono sempre valutati, anche se il primo blocca: un
  // corto circuito renderebbe il percorso strutturalmente diverso (e quindi
  // misurabile) fra i due casi.
  const [byEmail, byIp] = await Promise.all([
    limitForgotPasswordByEmail(email),
    limitForgotPasswordByIp(req),
  ]);

  const allowed = byEmail.allowed && byIp.allowed;

  if (allowed) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Log volutamente privo di qualunque dato: nessuna email, nessun IP,
      // nessun corpo. Solo il fatto che manca la configurazione.
      console.error('[forgot-password] missing_supabase_env');
    } else {
      try {
        // Chiave anon, non service_role: per far partire un'email di
        // recupero l'API pubblica basta, e un segreto con privilegi pieni
        // non deve entrare in un percorso raggiungibile da chiunque.
        const recovery = createRecoveryClient();

        // L'esito NON viene ispezionato di proposito: esista o meno
        // l'indirizzo, la risposta a chi chiama e' sempre la stessa.
        await recovery.auth.resetPasswordForEmail(email, {
          redirectTo: `https://www.fitmesh.fit/${safeLocale}/auth/reset-password`,
        });
      } catch {
        // Inghiottito: qualunque esito produce la stessa risposta. Nessun
        // log del contenuto — conterrebbe l'indirizzo email.
      }
    }
  }

  await settleMinimumDuration(startedAt);
  return neutralResponse();
}

/**
 * Qualunque altro metodo riceve 405. Non e' un dettaglio estetico: senza,
 * Next.js risponderebbe comunque 405 ma senza `Allow`, e un GET con l'email
 * in query string finirebbe nei log di accesso — esattamente cio' che
 * questo flusso evita ovunque.
 */
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      Allow: 'POST',
      'Cache-Control': 'no-store',
    },
  });
}
