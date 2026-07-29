/**
 * Rate limiter via Supabase Postgres (cybersec P0-001).
 *
 * Edge-runtime-compatible (usato da middleware.ts). Chiama la RPC
 * `rate_limit_check(key, max, window_seconds)` definita nella migration
 * `rate_limit_buckets_and_rpc`. Atomic UPSERT + return current count.
 *
 * Architettura scelta vs alternative:
 * - Upstash Redis: free tier limita a 1 DB/account (Matteo gia' usato per
 *   altro progetto). Avremmo dovuto pagare o creare account secondario.
 * - Postgres Supabase: zero external dep, gia' nel nostro stack, fixed window
 *   1-min sufficiente per nostro scale. Latency ~5ms in piu' di Redis ma
 *   impercettibile per utente.
 *
 * Policy (vedi limitSync / limitSignup):
 * - /api/v1/sync: per user_id (estratto da JWT bearer senza validation,
 *   rate limit non e' security boundary). Fallback a IP. Limite 60/min.
 *   Sync normale fa ~4 req/h, 60/min e' ampio cuscino + blocca abuse-via-curl.
 * - /api/v1/beta/signup: per IP. 10/min. Public endpoint, blocca spam
 *   email registration + protegge Resend quota.
 *
 * Fail-open: se Supabase RPC fallisce (network error, deploy in corso, ecc.),
 * permettiamo la request. Mai bloccare prod per nostro outage. Trade-off
 * accettato: durante outage Supabase, rate limit disabilitato → fallback a
 * Vercel platform protections (DDoS layer baseline).
 *
 * Cleanup: rows vecchie >1h cancellate da rate_limit_cleanup() chiamata
 * dal cron daily beta-welcome-emails (riusiamo lo slot Hobby).
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Estrae l'user_id (sub) dal JWT bearer senza validare la firma.
 * USO SOLO per rate limit keying — la validazione vera arriva dopo nel
 * route handler tramite supabase.auth.getUser(token).
 *
 * Ritorna null se manca header, formato sbagliato, payload non parsabile.
 */
function extractUserIdFromBearer(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Estrae IP client da headers Vercel/edge. */
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

type LimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
};

const ALLOWED_FAILOPEN: LimitResult = {
  allowed: true,
  limit: 0,
  remaining: 0,
};

/**
 * Chiama RPC rate_limit_check via Supabase con anon key (la RPC e' security
 * definer quindi bypassa RLS). Stateless: nuovo client per ogni request del
 * middleware — la classe di Supabase e' leggera, niente connection pool da
 * mantenere.
 */
async function callRateLimitRpc(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<LimitResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return ALLOWED_FAILOPEN;

  try {
    // Client minimale: niente cookies, niente auth (la RPC e' callable da anon).
    const sb = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll(_cookies: CookieToSet[]) {
          // no-op
        },
      },
    });

    const { data, error } = await sb.rpc("rate_limit_check", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return ALLOWED_FAILOPEN;
    }
    const row = data[0] as { allowed?: boolean; remaining?: number };
    return {
      allowed: row.allowed === true,
      limit: max,
      remaining: typeof row.remaining === "number" ? row.remaining : 0,
    };
  } catch {
    return ALLOWED_FAILOPEN;
  }
}

/** Rate limit per /api/v1/sync. 60 req/min per user_id (fallback IP). */
export async function limitSync(req: Request): Promise<LimitResult> {
  const userId = extractUserIdFromBearer(req);
  const key = userId
    ? `sync:user:${userId}`
    : `sync:ip:${getClientIp(req)}`;
  return callRateLimitRpc(key, 60, 60);
}

/** Rate limit per /api/v1/beta/signup. 10 req/min per IP. */
export async function limitSignup(req: Request): Promise<LimitResult> {
  const key = `signup:ip:${getClientIp(req)}`;
  return callRateLimitRpc(key, 10, 60);
}

/**
 * Rate limit per preview/join inviti famiglia. 20 req/min per IP.
 * Endpoint pubblici (service_role server-side) con namespace codici piccolo
 * (MESH-XXXX): senza limite sono enumerabili via brute-force.
 */
export async function limitInvitePreview(req: Request): Promise<LimitResult> {
  const key = `invite:ip:${getClientIp(req)}`;
  return callRateLimitRpc(key, 20, 60);
}

/**
 * Hotfix P0.10R — digest opaco per le chiavi di rate limit del recupero
 * password.
 *
 * Le chiavi finiscono in `public.rate_limit_buckets`, che e' una tabella
 * normale: scriverci dentro `recovery:email:mario@rossi.it` significherebbe
 * costruire, come effetto collaterale di un limite anti-abuso, un elenco in
 * chiaro di chi ha provato a recuperare la password. Stesso discorso per
 * l'IP. Qui si scrive solo un digest.
 *
 * HMAC-SHA256 quando `IP_HASH_SALT` esiste (segreto server-only gia' in uso
 * per lo stesso scopo in /api/v1/beta/signup), altrimenti SHA-256 semplice
 * con namespace. **Nessuna nuova variabile Vercel obbligatoria**: senza il
 * segreto l'endpoint funziona lo stesso, con una garanzia piu' debole —
 * un digest non-keyed di un indirizzo email e' teoricamente attaccabile per
 * forza bruta da chi abbia gia' accesso in lettura alla tabella (che pero'
 * e' service-role only). Impostare `IP_HASH_SALT` chiude anche quello.
 *
 * Web Crypto e non `node:crypto`: questo modulo e' importato anche dal
 * middleware, che gira su Edge runtime.
 */
async function opaqueKey(namespace: string, value: string): Promise<string> {
  const secret = process.env.IP_HASH_SALT;
  const encoder = new TextEncoder();
  const data = encoder.encode(`${namespace}:${value}`);

  let digest: ArrayBuffer;
  if (secret) {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    digest = await crypto.subtle.sign('HMAC', key, data);
  } else {
    digest = await crypto.subtle.digest('SHA-256', data);
  }

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

/**
 * Normalizzazione dell'indirizzo prima del digest: solo `trim` + `toLowerCase`.
 *
 * Deliberatamente NIENTE stripping del plus-address e nessuna manipolazione
 * del dominio: `mario+fitmesh@x.it` e `mario@x.it` sono, per Supabase Auth,
 * due account potenzialmente distinti — normalizzarli insieme farebbe
 * scattare il limite di uno sull'altro, cioe' un utente potrebbe bloccare il
 * recupero password di un altro.
 */
export function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Recupero password, DUE limiti indipendenti — entrambi sempre valutati.
 *
 * L'endpoint e' pubblico, non autenticato, e fa partire un'email verso un
 * indirizzo scelto da chi chiama: senza limite server-side e' utilizzabile
 * sia per floodare la casella di una vittima, sia per bruciare la quota di
 * invio del progetto. La guardia lato interfaccia (bottone disabilitato)
 * non conta: chiunque puo' chiamare l'endpoint con curl.
 *
 * Perche' due chiavi separate e non una:
 * - per EMAIL (3 / 15 min): impedisce di martellare la casella di una
 *   singola vittima ruotando IP (VPN, botnet, IPv6 /64).
 * - per IP (20 / 15 min): impedisce a un singolo chiamante di enumerare o
 *   spammare molti indirizzi diversi, cosa che la chiave per email non
 *   vedrebbe mai.
 * Nessuna delle due da sola copre l'altro scenario. Basta che UNA scatti.
 *
 * FAIL-OPEN, come tutto il resto del limiter (vedi intestazione del file):
 * se la RPC Supabase fallisce, la richiesta viene permessa. E' una scelta
 * gia' presa per questo modulo (mai bloccare la produzione per un nostro
 * disservizio) e qui la si eredita senza modificarla.
 */
export async function limitForgotPasswordByEmail(email: string): Promise<LimitResult> {
  const key = await opaqueKey('recovery:email', normalizeRecoveryEmail(email));
  return callRateLimitRpc(`recovery:email:${key}`, 3, 900);
}

/** Vedi `limitForgotPasswordByEmail`: namespace distinto, chiave indipendente. */
export async function limitForgotPasswordByIp(req: Request): Promise<LimitResult> {
  const key = await opaqueKey('recovery:ip', getClientIp(req));
  return callRateLimitRpc(`recovery:ip:${key}`, 20, 900);
}

/** Costruisce response 429 standard con headers RateLimit-*. */
export function buildRateLimitResponse(result: LimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: "Too many requests. Please retry later.",
      retryAfter: 60,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": "60",
        "x-ratelimit-limit": result.limit.toString(),
        "x-ratelimit-remaining": result.remaining.toString(),
      },
    },
  );
}
