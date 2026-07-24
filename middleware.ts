/**
 * Next.js middleware — canonicalizzazione host, negoziazione lingua, auth.
 *
 * Eseguito su OGNI request (vedi `config.matcher` in fondo). Compiti, in
 * ordine di esecuzione:
 *
 *  1. Canonicalizzazione `fitmesh.fit` -> `www.fitmesh.fit` (apex), un solo
 *     hop, con negoziazione lingua collassata nella stessa risposta quando
 *     serve (P0.4C).
 *  2. Rate limiting su route ad alto rischio (sync, signup, invite preview).
 *  3. Redirect di root `/` e deep link senza prefisso lingua al path
 *     localizzato corretto (negoziazione cookie -> Accept-Language -> geo
 *     IP -> 'en').
 *  4. Refresh dei cookie di sessione Supabase + verifica utente — SOLO su
 *     `/[locale]/app/*` e `/[locale]/admin/*` (P0.4C Fase 4: le pagine
 *     marketing pubbliche non fanno piu' questo round-trip). La verifica
 *     `is_admin` per `/admin/*` resta in `app/[locale]/admin/layout.tsx`
 *     server-side (qui non possiamo chiamare RPC, Edge runtime ristretto).
 *
 * Best practice 2026: usare `getUser()` invece di `getSession()` per il check
 * (verifica il JWT contro Supabase Auth, vs leggere solo il cookie locale).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import {
  buildRateLimitResponse,
  limitInvitePreview,
  limitSignup,
  limitSync,
} from '@/lib/rate-limit/limiter';
import { locales } from '@/lib/i18n';
import { resolveNegotiatedLocale, LOCALE_COOKIE_NAME } from '@/lib/locale-negotiation';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = ['/app', '/admin'] as const;

// Single source of truth: keep locale routing in sync with lib/i18n (incl. pl/tr).
const LOCALES = locales;

function stripLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function isProtected(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`),
  );
}

function detectLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  // /delete-account (P0.4D): pagina non localizzata con inglese come lingua
  // di default (il toggle IT client-side aggiorna <html lang> da solo, vedi
  // components/DeleteAccountView.tsx) — senza questo caso il fallback 'it'
  // sotto renderebbe <html lang="it"> su una pagina il cui contenuto SSR e'
  // in inglese, la stessa contraddizione che il P0.4C ha eliminato altrove.
  if (pathname === '/delete-account' || pathname.startsWith('/delete-account/')) {
    return 'en';
  }
  return 'it';
}

// Path prefixes che NON richiedono il locale prefix (route top-level non-i18n).
// `/delete-account` (P0.4D): requisito Google Play/App Store, un solo URL
// pubblico raggiungibile senza login ne' redirect di lingua — mai
// `/it/delete-account`, `/de/delete-account`, ecc.
const NON_LOCALIZED_PREFIXES = ['/api', '/cms', '/oauth', '/mockups', '/delete-account', '/_next', '/.well-known'] as const;

function needsLocalePrefix(pathname: string): boolean {
  // Skip route non localizzate.
  if (NON_LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  // Skip asset statici (anche se il matcher dovrebbe gia' escluderli).
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$/i.test(pathname)) return false;
  // Gia' ha un locale prefix.
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return false;
  // Root '/' e ogni altro deep link senza prefisso lingua passano dalla
  // negoziazione (cookie -> Accept-Language -> geo IP -> 'en').
  return true;
}

/**
 * Aggiunge gli header di risposta comuni a ogni redirect emesso da questo
 * middleware, e rimuove esplicitamente `Accept-CH`/`Critical-CH` se una
 * qualsiasi versione a monte (Next.js/Vercel) li avesse gia' impostati su
 * questa risposta.
 *
 * P0.4C — incidente: `Critical-CH: Sec-CH-Prefers-Color-Scheme` forza,
 * per specifica Client Hints, un retry OBBLIGATORIO lato browser sulla
 * primissima richiesta di un contesto che non ha ancora quell'hint in
 * cache per l'origin — cioe' un secondo "load" automatico della stessa
 * pagina. Ne' `Accept-CH` ne' `Critical-CH` sono dichiarati da nessun file
 * di questo repository (verificato: assenti da next.config.mjs, vercel.json,
 * e da ogni headers()/route handler in app/lib/components) — l'origine e'
 * quindi una qualche funzionalita' di piattaforma (Vercel Toolbar o simile),
 * non applicativa. FitMesh non fa alcun rendering server-side dipendente dal
 * colorScheme del client (dark/light e' gestito interamente in CSS via
 * `prefers-color-scheme` media query), quindi non ha alcun bisogno di questi
 * header: la rimozione qui e' un tentativo best-effort — se lo strato che li
 * inietta si trova A VALLE di questa risposta (proxy Vercel esterno al
 * codice applicativo), va rimosso invece da Vercel Project Settings.
 */
function stripClientHintHeaders(response: NextResponse): NextResponse {
  response.headers.delete('Accept-CH');
  response.headers.delete('Critical-CH');
  return response;
}

const CANONICAL_HOST = 'www.fitmesh.fit';
const APEX_HOST = 'fitmesh.fit';

// 'nb' (norvegese bokmål) e 'nn' (nynorsk) non sono mai state locale
// supportate (vedi lib/i18n.ts: solo 'no' esiste) — ma non essendo in
// LOCALES, un path '/nb/...' non veniva riconosciuto come "già prefissato"
// da needsLocalePrefix() sotto, che lo trattava come un deep link SENZA
// prefisso e ci PREPENDEVA davanti la lingua negoziata: risultato
// '/it/nb/blog/...'. Canonicalizzazione esplicita PRIMA di tutto il resto.
const NORWEGIAN_PREFIX_RE = /^\/(?:nb|nn)(?=\/|$)/;

function canonicalizeNorwegianPrefix(pathname: string): string | null {
  if (!NORWEGIAN_PREFIX_RE.test(pathname)) return null;
  return pathname.replace(NORWEGIAN_PREFIX_RE, '/no');
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // ── Canonicalizzazione /nb, /nn -> /no (P0.8) ───────────────────────────
  // Deterministico (non dipende da cookie/Accept-Language/IP): 308
  // permanente, un solo hop anche da apex (host + prefisso collassati
  // insieme, stesso pattern del branch apex->www sotto), pathname restante
  // e query string preservati da new URL(...).
  const norwegianPathname = canonicalizeNorwegianPrefix(pathname);
  if (norwegianPathname) {
    const targetUrl = new URL(request.nextUrl.toString());
    targetUrl.host = CANONICAL_HOST;
    targetUrl.pathname = norwegianPathname;
    return stripClientHintHeaders(NextResponse.redirect(targetUrl, 308));
  }

  // ── Canonicalizzazione apex -> www (P0.4C) ──────────────────────────────
  //
  // Prima di questo fix il redirect apex->www viveva in next.config.mjs
  // (`redirects()`), un meccanismo dichiarativo che serviva anche una
  // risposta `content-type: text/plain` invece dell'HTML applicativo (oltre
  // a produrre due hop invece di uno). Sostituito con un redirect esplicito
  // NextResponse.redirect qui: pieno controllo su Cache-Control/Vary, e —
  // cosa che il vecchio meccanismo NON faceva — canonicalizzazione host +
  // negoziazione lingua collassate in UN solo hop invece di due (apex->www
  // seguito da un secondo redirect per la lingua).
  //
  // P0.4C follow-up (2026-07-13): l'header `Refresh: 0;url=...` non veniva
  // dal vecchio meccanismo `redirects()` come ipotizzato inizialmente, ma
  // dal runtime server di Next.js stesso, che aggiunge incondizionatamente
  // `Refresh` su QUALSIASI redirect con status 308 (Permanent Redirect),
  // come compatibilita' legacy IE11, indipendentemente da dove il redirect
  // viene emesso (middleware incluso). 307 non e' interessato (branch
  // sopra, negoziazione lingua).
  // Per questo la branch sotto usa 301 invece di 308 per lo swap host puro:
  // 301 e' altrettanto "permanente" per browser/crawler/SEO e non ha questo
  // effetto collaterale. Eccezione: `/api/*` resta 308 per preservare il
  // metodo HTTP (un redirect di una richiesta POST non deve degradare a GET
  // in client legacy che seguono 301 in modo non conforme a RFC 7538).
  //
  // `/.well-known/*` non viene MAI rediretto: Android (assetlinks.json) e
  // Apple (apple-app-site-association) verificano la proprieta' del dominio
  // richiedendo questo path SENZA seguire redirect.
  if (host === APEX_HOST && !pathname.startsWith('/.well-known')) {
    const targetUrl = new URL(request.nextUrl.toString());
    targetUrl.host = CANONICAL_HOST;

    if (needsLocalePrefix(pathname)) {
      const locale = resolveNegotiatedLocale({
        cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
        acceptLanguage: request.headers.get('accept-language'),
        country: request.headers.get('x-vercel-ip-country'),
      });
      targetUrl.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
      const redirectResponse = NextResponse.redirect(targetUrl, 307);
      redirectResponse.headers.set('Cache-Control', 'private, no-store');
      redirectResponse.headers.set('Vary', 'Accept-Language, Cookie');
      return stripClientHintHeaders(redirectResponse);
    }

    // Path gia' localizzato (es. /de) o route di sistema non localizzata
    // (/api, /cms, /oauth, /mockups, /_next): swap host puro, path
    // preservato as-is, nessuna decisione di lingua coinvolta -> cacheable.
    if (pathname.startsWith('/api')) {
      return stripClientHintHeaders(NextResponse.redirect(targetUrl, 308));
    }
    return stripClientHintHeaders(NextResponse.redirect(targetUrl, 301));
  }

  // Rate limit FIRST (P0-001 cybersec): blocca abuse-via-curl prima di
  // sprecare round-trip Supabase auth refresh. Fail-open su errore Supabase.
  // Solo route ad alto rischio. Resto del traffico passa through.
  if (pathname === '/api/v1/sync') {
    const result = await limitSync(request);
    if (!result.allowed) {
      return buildRateLimitResponse(result);
    }
  } else if (pathname === '/api/v1/beta/signup') {
    const result = await limitSignup(request);
    if (!result.allowed) {
      return buildRateLimitResponse(result);
    }
  } else if (
    // Anti-enumerazione codici invito MESH-XXXX: copre sia l'API preview
    // sia la pagina join (Server Component che fa la stessa query).
    pathname.startsWith('/api/v1/invites/') ||
    stripLocale(pathname).startsWith('/famiglia/join/')
  ) {
    const result = await limitInvitePreview(request);
    if (!result.allowed) {
      return buildRateLimitResponse(result);
    }
  }

  // Redirect di root '/' e deeplink senza locale (es. share URL
  // "/famiglia/join/CODE") al path localizzato corretto. Risolve il 404
  // quando l'app condivide URL senza prefix locale, e sostituisce il
  // precedente permanentRedirect('/it') hardcoded in app/(frontend)/page.tsx.
  // Fa il redirect PRIMA del refresh sessione per evitare di sprecare
  // round-trip Supabase su una request che cambia URL.
  //
  // 307 (temporaneo), non 308: la lingua scelta può cambiare da una visita
  // all'altra (cookie/Accept-Language/IP), quindi non è un redirect
  // "permanente" nel senso HTTP del termine — un browser/crawler non deve
  // memorizzarlo come canonico per sempre. Cache-Control: private, no-store
  // e Vary: Accept-Language, Cookie impediscono a CDN/browser di servire la
  // stessa destinazione a visitatori con segnali diversi.
  if (needsLocalePrefix(pathname)) {
    const locale = resolveNegotiatedLocale({
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      acceptLanguage: request.headers.get('accept-language'),
      country: request.headers.get('x-vercel-ip-country'),
    });
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    const redirectResponse = NextResponse.redirect(url, 307);
    redirectResponse.headers.set('Cache-Control', 'private, no-store');
    redirectResponse.headers.set('Vary', 'Accept-Language, Cookie');
    return stripClientHintHeaders(redirectResponse);
  }

  // P0.9: niente piu' iniezione di 'x-fitmesh-locale' — il root layout
  // localizzato (app/(frontend)/[locale]/layout.tsx) ricava la lingua da
  // `params.locale`, non da un header di richiesta. Leggere un header via
  // headers() e' una Dynamic API (Next.js 15) e rendeva dinamico l'intero
  // albero (frontend), vanificando generateStaticParams() ovunque — vedi
  // docs/ops/vercel-fluid-cpu-audit-2026-07-24.md.
  void search; // gia' preservata da NextResponse.next
  const response = NextResponse.next();

  // P0.4C Fase 4: il round-trip Supabase (getUser + refresh cookie) ora gira
  // SOLO su /app e /admin (route realmente autenticate), non piu' su ogni
  // pagina marketing pubblica. Riduce latenza/Fluid CPU/superficie di errore
  // sulla stragrande maggioranza del traffico (homepage, blog, landing).
  // Non e' provato che questo fosse causa del reload di Safari — e' un
  // irrobustimento indipendente, non una correzione del loop in se'.
  if (!isProtected(pathname)) {
    return stripClientHintHeaders(response);
  }

  let authResponse = response;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          authResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            authResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Verifica autenticazione contro Supabase Auth (non solo cookie locale).
  // Best practice: `getUser` revalidata il JWT, `getSession` solo legge cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = detectLocale(pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return stripClientHintHeaders(authResponse);
}

// P0.9: matcher ridotto da "tutto tranne asset statici" a una lista
// positiva di casi realmente motivati — le pagine marketing localizzate su
// www.fitmesh.fit (la stragrande maggioranza del traffico) non attraversano
// piu' affatto il middleware. Vedi
// docs/ops/vercel-fluid-cpu-audit-2026-07-24.md per il prima/dopo (446
// invocazioni middleware su 7gg prima di questo cambio).
//
// Ogni entry e' una string literal semplice, MAI un template literal con
// interpolazione (`${...}`): Next.js analizza `config.matcher` staticamente
// a livello di sorgente (AST) per estrarlo senza eseguire il bundle del
// middleware, e un template literal con espressioni fa fallire la build
// ("Unsupported template literal with expressions at config.matcher[n]").
// L'alternanza locale (it|en|es|...) e' quindi scritta per esteso in ogni
// pattern che la usa, invece che referenziata da una costante condivisa —
// tenerla sincronizzata A MANO con lib/i18n.ts LOCALES, stesso principio di
// manutenzione gia' presente per NON_LOCALIZED_PREFIXES in questo file.
// Verificato da middleware.matcher.test.ts e da
// tools/check-vercel-fluid-cpu.ts.
export const config = {
  matcher: [
    // 1. Root: negoziazione lingua (ed eventuale swap apex->www in un colpo solo).
    '/',

    // 2. Deep link SENZA prefisso locale valido — include /nb, /nn
    //    (canonicalizzazione deterministica verso /no, P0.8) e qualunque
    //    altro path non riconosciuto, per la negoziazione lingua. Esclude
    //    esplicitamente: asset Next.js, file statici, le 15 locale reali
    //    (ora servite direttamente da www senza passare qui), e le route
    //    di sistema che non necessitano piu' di alcuna elaborazione qui
    //    (/api tranne i 3 endpoint rate-limited sotto, /cms, /oauth,
    //    /mockups, /delete-account, /.well-known).
    '/((?!_next/static|_next/image|favicon\\.ico|logo-.*|(?:it|en|es|de|pt|fr|pl|tr|nl|ja|ko|sv|da|no|fi)(?:/|$)|api(?:/|$)|cms(?:/|$)|oauth(?:/|$)|mockups(?:/|$)|delete-account(?:/|$)|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',

    // 3. Route protette (refresh sessione + verifica utente Supabase):
    //    /[locale]/app/* e /[locale]/admin/*. Un solo gruppo catturante
    //    esterno subito dopo lo slash iniziale (come il pattern #2 sopra):
    //    path-to-regexp non riconosce gruppi non-catturanti multipli a
    //    livello superiore ("Pattern cannot start with '?'"), ma tratta il
    //    contenuto di UN gruppo esterno come regex grezza per quel singolo
    //    parametro posizionale — stessa tecnica del pattern #2.
    '/((?:it|en|es|de|pt|fr|pl|tr|nl|ja|ko|sv|da|no|fi)/(?:app|admin)(?:/.*)?)',

    // 4. Rate limit — SOLO questi 3 endpoint API ad alto rischio (P0-001
    //    cybersec). Ogni altro /api/* non ha bisogno del middleware: nessun
    //    rate limit, nessun refresh sessione (isProtected copre solo
    //    /app e /admin), l'iniezione locale e' stata rimossa (punto 2 sopra).
    '/api/v1/sync',
    '/api/v1/beta/signup',
    '/api/v1/invites/:path*',

    // 5. famiglia/join/[code]: anti-enumerazione codici invito. Copre sia
    //    il deep link senza locale (gia' incluso dal punto 2, ma esplicito
    //    qui per chiarezza) sia la variante con prefisso locale esplicito
    //    (es. /it/famiglia/join/MESH-XXXX), che il punto 2 escluderebbe.
    '/famiglia/join/:code*',
    '/((?:it|en|es|de|pt|fr|pl|tr|nl|ja|ko|sv|da|no|fi)/famiglia/join/.*)',
  ],
};
