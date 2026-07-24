# Runbook — Password recovery (FitMesh)

Hotfix P0 2026-07-24. Flusso OTP esplicito scanner-safe, sostituisce il vecchio
flusso a link auto-verificante (hash/PKCE code + `getSession()` fallback).

## Architettura

1. L'app Flutter chiama `resetPasswordForEmail(email, redirectTo)` — invariato,
   vedi `AppFitmesh/flutter_app/lib/core/auth/auth_repository.dart:109`.
   `redirectTo` è sempre `https://www.fitmesh.fit/<loc>/auth/reset-password`
   con `<loc>` prodotto da `siteLocaleFor()`
   (`AppFitmesh/flutter_app/lib/core/config/site_locale.dart`), che mappa
   qualunque lingua app non pubblicata sul sito a `en`. Le uniche 11 locali
   realmente generate sono: it, en, es, de, pt, fr, pl, tr, nl, ja, ko.
2. L'email (template `supabase/templates/recovery.html`, versionato in questo
   repo) mostra `{{ .Token }}` (OTP a 6 cifre) in chiaro. Il link nell'email
   punta solo a `{{ .RedirectTo }}`, non verifica/consuma nulla da solo:
   sicuro da prefetch/scanner.
3. La pagina `/[locale]/auth/reset-password` chiede email + codice + nuova
   password nello stesso form. Al submit:
   - `verifyOtp({ email, token, type: 'recovery' })` su un client Supabase
     ISOLATO (`lib/supabase/recovery-client.ts`): `persistSession: false`,
     `autoRefreshToken: false`, `detectSessionInUrl: false`, istanza nuova ad
     ogni submit. Non è mai il client singleton cookie-backed del sito
     (`lib/supabase/client.ts`) usato per la sessione ordinaria.
   - solo se la verifica riesce, `updateUser({ password })` sullo stesso
     client isolato.
   - `signOut({ scope: 'local' })` per igiene, poi schermata di successo.
4. Errori classificati (`lib/recovery/classify-error.ts`): scaduto/già
   usato/codice errato (un solo messaggio, Supabase non li distingue in modo
   affidabile), rate limit, rete, generico. Ogni categoria ha copy dedicata e
   il form resta utilizzabile per un nuovo tentativo.

## Configurazione Supabase richiesta (NON ancora applicata in produzione)

**Da applicare solo con approvazione esplicita di Matteo.**

### Redirect URLs (Authentication → URL Configuration)

Aggiungere, in aggiunta a quelle esistenti, ESATTAMENTE queste 22 voci (11
locali × {localhost, www.fitmesh.fit}), niente wildcard — vedi
`supabase/config.toml` per la lista completa versionata:

```
http://localhost:3000/<loc>/auth/reset-password
https://www.fitmesh.fit/<loc>/auth/reset-password
```
con `<loc>` ∈ {it, en, es, de, pt, fr, pl, tr, nl, ja, ko}.

### Template email "Reset password"

Sostituire il body con il contenuto di `supabase/templates/recovery.html`
(mostra `{{ .Token }}`, link solo a `{{ .RedirectTo }}`, MAI
`{{ .ConfirmationURL }}`). Subject: "FitMesh password reset code" (vedi
`supabase/config.toml`, sezione `[auth.email.template.recovery]`).

**Il template Supabase è GLOBALE** (uno solo per l'intero progetto, non
parametrizzabile per la locale del destinatario): subject e corpo sono in
inglese di proposito (English-first, comprensibile a chiunque lo riceva).
La pagina web È tradotta in tutte le 11 locale reali; l'email NO. Questo non
è un difetto di questo hotfix, è un limite della piattaforma — non
dichiarare mai il template "localizzato".

### Diff esatto da applicare (Dashboard, dato che `supabase config push` non è
stato eseguito in questo hotfix)

| Campo | Prima (da verificare, non ancora confermato in produzione) | Dopo |
|---|---|---|
| Redirect URLs | assenti per `/auth/reset-password` (confermato solo per il config.toml locale, NOT VERIFIED IN PRODUCTION) | +22 voci sopra |
| Template recovery | sconosciuto (Dashboard-only, NOT VERIFIED IN PRODUCTION) | `supabase/templates/recovery.html` (globale, English-first) |
| Subject template recovery | sconosciuto | "FitMesh password reset code" |

## Rollback

1. Ripristinare il body del template precedente (backup manuale prima di
   applicare: copiare il contenuto attuale dal Dashboard prima di sostituirlo).
2. Le Redirect URLs aggiunte sono additive, non rimuovono nulla: nessun
   rollback necessario per quelle, si possono lasciare anche se si torna al
   flusso vecchio.
3. Revert del deploy sito (Vercel → Deployments → promuovi il deployment
   precedente).

## Test periodico (da ripetere ad ogni modifica di questo flusso)

1. Richiesta reset dall'app (locale IT), apertura email su device diverso,
   inserimento codice + nuova password → login riuscito con la nuova password.
2. Aprire il link dell'email (senza inserire il codice) da un browser dove è
   già loggato un ALTRO account → verificare che il form richieda comunque
   email+codice e non tocchi la sessione di quell'altro account.
3. Attendere la scadenza del codice (o richiederne uno nuovo e provare quello
   vecchio) → messaggio "codice non più valido", nuovo tentativo possibile.
4. `curl -sD- https://www.fitmesh.fit/it/auth/reset-password -o /dev/null | grep -i "cache-control\|referrer-policy"`
   → deve mostrare `no-store` e `no-referrer`.

## E2E eseguito (Supabase locale + Mailpit, database disposable, 2026-07-24)

Ambiente: `supabase start` locale (Postgres+GoTrue+Mailpit via Docker), le
migrazioni `public.*` NON sono state applicate per questo run (2 bug SQL
preesistenti e indipendenti dal hotfix le bloccano, vedi sezione dedicata
sotto — l'auth/recovery non dipende dallo schema `public`). Container e utenti
QA distrutti a fine test (`supabase stop` + rimozione volumi Docker
`supabase_db_fitmesh`/`supabase_edge_runtime_fitmesh`/`supabase_storage_fitmesh`).

Risultato dei 14 punti richiesti:

1. Redirect URL per locale: verificato per `en` (server live, vedi Fase 5);
   le altre 10 condividono lo stesso codice/allowlist, non ri-testate una per
   una a mano.
2. Pagina senza OTP: submit senza codice → `errorMissingFields`, nessuna
   chiamata a `updateUser` (guard nativo `required` + guard JS separato,
   entrambi testati).
3. Sessione browser esistente: il client isolato non ha mai letto una
   sessione ambient (nessun `getSession()` nel codice; verificato anche via
   `localStorage`/`cookie` del browser reale dopo il flusso completo — zero
   artefatti Supabase, solo cookie-consent/GA preesistenti).
4. Link scanner-safe: mount della pagina (incluso un secondo "doppio open")
   → zero richieste di rete verso Supabase, OTP ancora valido dopo.
5. Doppia apertura simulata: vedi punto 4.
6. Email+OTP+password reali (utente QA A, Mailpit) → submit via browser
   reale (Playwright) → schermata di successo.
7. `verifyOtp(recovery)` → `updateUser`: confermato nell'ordine corretto
   (verifyOtp prima di updateUser, mai invertito).
8. Login con password nuova: **PASS**.
9. Login con password vecchia: **FAIL** (Invalid login credentials).
10. Riutilizzo dello stesso OTP: **FAIL** ("Token has expired or is
    invalid" lato Supabase → UX `errorExpiredOrUsed` mostrata, form resta
    utilizzabile).
11. Due richieste consecutive per lo stesso utente: **solo la PIÙ RECENTE
    resta valida** (verificato: il token della richiesta #1 viene rifiutato
    non appena la richiesta #2 e' stata emessa; il token #2 viene accettato).
    Comportamento Supabase nativo, coerente con la copy
    `errorExpiredOrUsed` ("usa soltanto l'email più recente").
12. Browser/sessione B + recovery A: **verificato a livello backend** (non
    tramite cookie reali nello stesso browser: la pagina di login del sito
    usa magic-link protetto da Cloudflare Turnstile, non completabile in
    automazione locale — limite dell'ambiente di test, non della pagina di
    recovery). Prova diretta: dopo il completamento del recovery di A,
    l'utente B effettua login con la SUA password originale invariata →
    **PASS**, a conferma che nessuna operazione su A ha toccato l'account B.
13. Nessuna sessione persistita dopo il completamento: verificato via
    ispezione diretta di `localStorage`/`document.cookie` nel browser dopo
    il flusso completo → nessun artefatto Supabase.
14. Nessuna email/OTP/password nei log: verificato via grep su console
    browser (client) e log del dev server (server) per l'intera sessione di
    test → zero occorrenze.

## Build production reale (2026-07-24)

`next build` eseguito nativamente (non in Docker: `next build` con Payload
CMS deve girare a diretto contatto col filesystem/DB) contro lo stesso
Postgres disposable dell'E2E. **Ha trovato un bug reale**: Next.js valida gli
export di un file `page.tsx` contro un allowlist fissa, e rifiuta named
export extra anche se `tsc --noEmit` da solo non lo segnala — i miei
`RESET_PASSWORD_LOCALES`/`TRANSLATIONS`/tipi esportati direttamente da
`page.tsx` rompevano la build. Fix: spostati in un modulo dedicato
(`translations.ts`), `page.tsx` torna a esportare solo `default` +
`dynamic`. Rebuild dopo il fix: **verde, zero errori/warning**.

## Limiti noti / follow-up non inclusi in questo hotfix

- `confirmation`/`magic_link` non hanno un template versionato in repo (solo
  `subject` in `config.toml`): stesso rischio di divergenza Dashboard/codice
  di prima di questo hotfix per QUEI due flussi. Non toccato qui, fuori scope.
- `next lint` non eseguibile in questo ambiente: nessuna configurazione ESLint
  committata nel repo (prompt interattivo di setup), gap preesistente non
  causato da questo hotfix.
- **2 bug SQL preesistenti, indipendenti da questo hotfix**, bloccano
  `supabase start` con le migrazioni `public.*` applicate (ho dovuto
  escluderle temporaneamente, MAI committato, per eseguire l'E2E auth):
  - `supabase/migrations/20260514120004_init_b2c_subs.sql:35` — `row` come
    nome parametro non quotato in una funzione SQL, sintassi non valida.
  - `supabase/migrations/20260522120006_rls_health_data_group_sharing.sql`
    — riferimento a una colonna `water_ml` che non esiste nello schema
    ricostruito da zero (probabile drift tra migrazioni committate e stato
    reale di produzione).
  Questi bug meritano un fix separato: al momento **nessuno sviluppatore può
  bootstrappare l'ambiente Supabase locale di questo progetto da zero**.
  Non ho toccato questi file (fuori scope per un hotfix auth), li segnalo
  qui esplicitamente.
- Login page del sito (magic-link) protetta da Cloudflare Turnstile: non
  completabile in automazione locale, per questo il punto 12 dell'E2E è
  stato verificato a livello backend invece che con una sessione-cookie
  browser reale per l'account B.
