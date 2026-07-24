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
`{{ .ConfirmationURL }}`). Subject: "Codice per reimpostare la password
FitMesh" (vedi `supabase/config.toml`, sezione `[auth.email.template.recovery]`).

### Diff esatto da applicare (Dashboard, dato che `supabase config push` non è
stato eseguito in questo hotfix)

| Campo | Prima (da verificare, non ancora confermato in produzione) | Dopo |
|---|---|---|
| Redirect URLs | assenti per `/auth/reset-password` (confermato solo per il config.toml locale, NOT VERIFIED IN PRODUCTION) | +22 voci sopra |
| Template recovery | sconosciuto (Dashboard-only, NOT VERIFIED IN PRODUCTION) | `supabase/templates/recovery.html` |
| Subject template recovery | sconosciuto | "Codice per reimpostare la password FitMesh" |

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

## Limiti noti / follow-up non inclusi in questo hotfix

- Copy tradotta solo per it/es/en (pattern preesistente della pagina); le
  altre 8 locali (de, pt, fr, pl, tr, nl, ja, ko) mostrano testo inglese,
  invariato rispetto a prima. Traduzione reale richiede il pipeline
  loctron/DeepL, non un translator locale (regola esistente).
- `confirmation`/`magic_link` non hanno un template versionato in repo (solo
  `subject` in `config.toml`): stesso rischio di divergenza Dashboard/codice
  di prima di questo hotfix per QUEI due flussi. Non toccato qui, fuori scope.
- `next lint` non eseguibile in questo ambiente: nessuna configurazione ESLint
  committata nel repo (prompt interattivo di setup), gap preesistente non
  causato da questo hotfix.
- `next build` non eseguito in questo ambiente (richiede credenziali database
  Payload non disponibili qui). Verificato invece: `tsc --noEmit` pulito su
  tutto il progetto, `vitest run` 196/196 verdi (184 preesistenti + 12 nuovi).
