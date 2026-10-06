# Contratto di accesso alla dashboard web, versione 1 (PROPOSTA da concordare con la lane app)

Stato: **proposta**. La migration `supabase/migrations/20260924120000_web_dashboard_access_verdict.sql`
**non e' applicata** in produzione e nessun GO e' stato dato. Questo documento non cambia diritti,
non spegne grant esistenti e non modifica l'app.

## 1. Principio: una funzione separata, non una seconda verita' commerciale

Il verdetto web e' una funzione **separata** dal nucleo dell'app (`private.entitlement_core`), per due
ragioni verificate: il nucleo concede anche la prova di 14 giorni e non guarda `active_until` nel ramo
abbonamento, e cambiarlo toccherebbe `user_has_active_entitlement`, il muro RLS delle scritture usato
dall'app. Due funzioni non possono pero' diventare due verita' incoerenti. La regola:

- le **fonti dei titoli** sono una sola: `user_roles`, `b2c_subscriptions`,
  `private.billing_pagamenti_segnalati` e la lista di revisione store;
- il nucleo e il verdetto web sono due **proiezioni** di quelle fonti;
- le uniche differenze ammesse sono **dichiarate e testate** (sezione 3). Una differenza nuova richiede una
  decisione di Matteo, un cambio di versione del contratto e un test.

Il test che lo fa rispettare e' `supabase/tests/reset-pg17/19-test-parita-nucleo-verdetto-web.sql`:
22 casi fianco a fianco, rosso se compare una differenza non dichiarata o se una dichiarata sparisce.

## 2. Interfaccia

- `public.get_web_dashboard_access()`: **nessun parametro**; l'identita' e' `auth.uid()` della sessione.
  `anon` non la raggiunge; senza `sub` nel JWT risponde 42501. La funzione privata
  `private.web_dashboard_verdict(uuid)` non e' eseguibile da `authenticated`.
- Risposta (`contractVersion` 1): `{ contractVersion, granted, titles[], denialReason, serverNow }`.
- Titoli riconosciuti: `app_review, founder, grandfather, lifetime_grant, timed_grant, lifetime_purchase,
  subscription, admin, manual_payment` (`TITOLI_DASHBOARD` in `lib/dashboard/verdetto.ts`), valutati **tutti
  insieme**: un titolo non ne nasconde un altro.
- Motivi di diniego: `trial_only, subscription_inactive, purchase_revoked, purchase_pending, no_entitlement`.
- Lato sito (`lib/dashboard/verdetto.ts`) la risposta diventa uno di quattro esiti: `concesso`, `negato`,
  `non_disponibile`, `non_autenticato` (42501 verso il login). **Fail-closed**: errore, timeout, funzione
  assente, versione diversa, risposta illeggibile, e **`granted=true` senza alcun titolo riconosciuto**
  (titolo nuovo, refuso, la prova mandata come titolo) non aprono mai dati: `non_disponibile`, riprova.
- Nessuna cache: il verdetto si chiede a ogni richiesta. Scadenza e revoca si vedono alla richiesta
  successiva (provato in test 19).

## 3. Differenze volute rispetto al nucleo (le sole)

| Id | Caso | Nucleo (app) | Verdetto web | Decisione |
|---|---|---|---|---|
| D1 | Prova di 14 giorni | concede (`trial`, `hasFullAccess`) | **nega** (`trial_only`) | n. 3: la prova non da' mai accesso |
| D2 | Abbonamento `active` **o `grace`** con `active_until` passato | concede (non guarda la data) | **nega** (`subscription_inactive`) | n. 6: scadenza = fine accesso |

Conseguenza per il web: **mai** usare `hasFullAccess` ne' `user_has_active_entitlement` come criterio di
idoneita'. Nell'app, «Pro» include la prova e i ripieghi locali (offline, cache dei ruoli, admin per email).

## 4. Due cancelli, da non confondere

- **Prototipo** (`lib/web-dashboard/flag.ts`, dati sintetici): solo locale; chiuso su ogni ambiente Vercel e in
  ogni build di produzione, qualunque variabile si imposti. Resta locale.
- **Dashboard reale** (`lib/dashboard/interruttore.ts`): fuori dalla produzione basta
  `FITMESH_WEB_DASHBOARD=1`, ma solo in **sviluppo locale** (NODE_ENV esattamente `development` o `test`,
  nessun `VERCEL_ENV`). Tutto il resto e' trattato come produzione (fail-closed: `NODE_ENV` assente o non
  standard, qualunque `VERCEL_ENV`, anteprime, `vercel dev`, `next start` auto-ospitato): li la variabile da
  sola **non accende**, decide `CAPABILITY_STATUS.webDashboard` nel codice di rilascio, che cambia solo con un
  commit approvato al release gate e dopo la migration applicata con un GO di Matteo. La variabile puo'
  solo spegnere, e solo con il valore esatto `0` (`FITMESH_WEB_DASHBOARD=0`). Oggi lo stato e'
  `in_development`: nessun ambiente diverso dallo sviluppo locale apre la pagina. Conseguenza da decidere
  al release gate: una volta promosso lo stato, la pagina si apre anche sulle anteprime Vercel (stesso
  codice); se non e' voluto serve una scelta separata.

## 5. Cosa la lane app deve confermare (per iscritto, prima del release gate)

1. Quali `state` e `active_until` scrive l'app in `b2c_subscriptions` per Apple e Google, e quando
   ripresenta l'acquisto (oggi rinnovi e rimborsi arrivano solo cosi': nessuna notifica store lato server).
2. L'acquisto Lifetime scrive la riga b2c (non `user_roles`).
3. Il tester e' una riga `user_roles` `pro` con nota libera: l'app ha un concetto proprio? Chi revoca e come
   (DELETE o `expires_at` nel passato: entrambi provati negati in test 19)?
4. Ponte iOS: dimensione della coorte, data di spegnimento, se in 192/192.1 `apple_iap` scrive gia' righe.
5. Founder: ogni Founder legittimo ha un posto nel ledger `private.founder_seats`; i grant manuali (account
   demo) sono eccezioni marcate. Il verdetto si fida della nota `founder-launch`, non del ledger.
6. Il significato di `kind` (contractVersion 2 del nucleo) non cambia in 192.x; il web non lo legge.
7. Un `contractVersion` diverso da 1 e' trattato dal sito come «non disponibile».
8. Limite noto: la risposta non porta l'`uid` della sessione; il sito lo lega al verdetto con
   `auth.getUser()` della stessa richiesta. Un contratto 2 potrebbe includere `userId` per chiudere la
   finestra fra le due chiamate (richiede migration e GO).

## 6. DECISIONI APERTE di Matteo: alternative, senza scegliere

Nessuna alternativa spegne un grant esistente ne' cambia un diritto dell'app. Nel test 19 il **ponte iOS e'
caratterizzato** (la matrice e il punto 2f fissano il comportamento ATTUALE: valido = `timed_grant`, scaduto =
negato; non e' un'approvazione e va aggiornato se la decisione cambia); `cancelled` con periodo residuo e
Founder solo riga b2c sono solo **stampati** (`PENDING`), non asseriti.

### 6.1 Ponte iOS (`concedi_ponte_ios`, migration `20260817201814`)
Oggi: a ogni utente iOS che sincronizza **dopo la prova** (quando il nucleo nega e c'e' una riga HealthKit)
il server scrive un ruolo `pro` di 6 mesi rinnovabile, nota `cessione-ios-in-attesa-apple-iap`
(`app/api/v1/sync/route.ts:218`). Il verdetto web lo conta come `timed_grant`. Effetto: per iOS l'esclusione
della prova dura 14 giorni e poi decade; la decisione 21 sulla Mesh non nomina il ponte, la 2 si'.
- **A. Tenerlo** (stato attuale): il ponte apre la dashboard web. Nessun lavoro. Va dichiarato che equivale a
  «tutti gli iOS dopo la prova» finche' dura il ponte.
- **B. Titolo separato `ios_bridge`** riconosciuto dalla nota `cessione-ios%`: la scelta diventa un cambio di
  una costante per superficie (web, Mesh). Richiede migration del verdetto, GO e un test asserito.
- **C. Non idoneo al web**: come B ma il titolo non e' fra quelli che aprono. Stessa migration; nessun diritto
  dell'app cambia.
Dato mancante: la conta aggregata del ponte (lettura di produzione, GO separato).

### 6.2 Abbonamento `cancelled` con periodo pagato residuo
Oggi il verdetto **nega** (`subscription_inactive`) e il nucleo pure; la proiezione 3B, se applicata, lo
porterebbe a `active`.
- **A. Negare** (oggi). Chi ha disdetto ma ha pagato fino a fine periodo vede «non attivo».
- **B. Concedere fino a `active_until`**: coerente con «valido finche' pagato»; richiede di leggere `cancelled`
  nel ramo abbonamento del verdetto (migration) e un caso asserito.
- **C. Dipendere dalla proiezione 3B**: nessuna modifica al verdetto; il comportamento segue cio' che 3B scrive.
Serve prima la conferma della lane app su cosa scrive per `cancelled`.

### 6.3 Altri punti collegati
- **Rinnovo non ripresentato**: «scaduto» falso per chi ha pagato e non riapre l'app (testo di diniego:
  «Se hai appena rinnovato, apri l'app FitMesh per aggiornare lo stato»). Alternativa: notifiche store lato
  server (lotto separato, nessun GO).
- **Founder registrato solo come riga b2c `founder_grant`**: oggi negato. Alternative: idoneo / non idoneo /
  riconciliare con il ledger (decisione 27).
- **Tester**: nessun discriminatore oltre alla nota. Alternative: convenzione di nota letta da una vista,
  oppure colonna dedicata (migration, GO).
- **Grace e `on_hold`**: il verdetto web concede `grace` e nega `on_hold`; la RPC di accettazione della Mesh
  conta anche `on_hold`. Un solo verdetto per web e Mesh richiede di scegliere (decisione per la Mesh).

## 7. Prove

- Eseguite su PG17 usa-e-getta (dati sintetici): `supabase/tests/reset-pg17/17-…`, `18-…`, `19-…`.
- Eseguite in vitest: `lib/dashboard/verdetto.test.ts` (fail-closed anche con titoli sconosciuti),
  `lib/dashboard/interruttore.test.ts`, `app/(frontend)/[locale]/auth/callback/route.test.ts`,
  `app/(frontend)/[locale]/auth/logout/route.test.ts`, e i test di cancello e sessione del ramo.
- **Non verificati**: la produzione (migration applicate, policy vive, coorte del ponte iOS, grant reali),
  cookie reali e `bfcache` su un browser, la risposta HTTP della dashboard reale su un ambiente vero.
