# Contratto entitlement post-Founder (Sprint P0.10, corretto in P0.10A)

**Stato requisito "trial → pagamento": `pending_device_and_store_verification`.**
Vale per l'intera durata di questo sprint e del successivo P0.10A: nessuna
riga qui sotto lo cambia, perché nessuna delle due migration tocca il
percorso trial/pagamento (fuori perimetro, vedi sotto). Non declassare
questo stato senza una conferma esplicita dell'agente AppFitmesh su device
reale (le 6 voci **Bloccante** in fondo a questo documento).

Cutoff unico: `FOUNDER_END_AT = 2026-07-31T22:00:00Z` (`lib/founder/program-window.ts`),
equivalente a `2026-08-01T00:00:00+02:00` CEST. Stesso valore lato SQL in
`private.grant_founder_launch_core` (verificato dal guardrail
`founder:window-check`, che confronta i due letteralmente).

**Nota P0.10A**: la bozza P0.10 originaria di `grant_founder_launch_core`
misurava la finestra di 14 giorni contro `now()` al momento di OGNI
chiamata (bug: una sync ripetuta poteva far scadere retroattivamente un
utente già eleggibile) e calcolava il cap 1000 contando le righe
`user_roles` correnti (bug: un account cancellato liberava il posto, i
posti riservati/non applicati in `founder_grants` non erano contati).
Corretto in P0.10A con un ledger persistente
(`private.founder_seats`/`private.founder_evaluations`, ripreso e adattato
dal design Sprint P0.7) e la finestra ancorata a `devices.first_sync_at`
(evidenza scritta una sola volta, alla prima sync riuscita — mai
rivalutata). La matrice sotto descrive il comportamento CORRETTO
(P0.10A); dove la formulazione poteva far pensare a un confronto con
`now()` corrente è stata aggiornata.

## Perché questo documento esiste

Il sito (fitthesite) non può, da solo, garantire che "dopo 14 giorni un
utente senza acquisto perda Pro": quella parte del contratto vive
nell'app Flutter e negli store (Apple/Google). Questo documento fissa la
riga di demarcazione: cosa è verificato/verificabile da questo repo, cosa
resta da confermare all'agente AppFitmesh su device reale prima di poter
dichiarare l'intero requisito "trial → pagamento" completato.

## Fonti di verità coinvolte

| Fonte | Cosa controlla | Verificata in questo sprint? |
|---|---|---|
| `auth.users.created_at` (Postgres) | Data di registrazione reale, mai un timestamp client | Sì, è l'unico input usato dal cutoff/finestra 14gg |
| `public.user_roles` (role='pro', note) | Chi ha Pro oggi e da quale fonte (`founder-launch`, o altra nota per acquisti) | Sì, letto/scritto solo da `grant_founder_launch_core` per il ramo Founder |
| `private.grant_founder_launch_core` | Eligibility Founder: cutoff + finestra 14gg (da `devices.first_sync_at`) + cap 1000 su ledger persistente + esclusioni + esito terminale mai rivalutato | Sì, suite in 8 fasi su `supabase/postgres` reale — funzionale, GDPR, ACL, esclusione+cutoff combinati, multi-device, fast-path esito terminale, concorrenza (vedi report P0.10A) |
| Introductory offer nativo Apple/Google (store-side) | Durata e applicazione del trial 14gg per i NON-Founder | **No** — nessun endpoint in questo repo verifica ricevute IAP; nessuna migration crea/scade un trial lato Supabase per il percorso non-Founder |
| AppFitmesh (Flutter, lato client) | UI paywall, chiamata a `record_first_sync_transition`, lettura entitlement, restore purchase | **No** — fuori dal perimetro di questo agente |

**Conclusione operativa:** il sito può GARANTIRE che nessun nuovo grant
Founder venga concesso dal cutoff in poi, e che i Founder/acquirenti
esistenti non vengano mai toccati. Il sito NON PUÒ garantire da solo che
un utente trial-scaduto-senza-acquisto perda l'accesso Pro nell'app: quel
comportamento dipende dalla logica app-side (probabilmente basata
sull'introductory offer nativo dello store, non su una riga Supabase) e
richiede conferma su device reale.

## Matrice entitlement

| Riga | Fonte di verità | Ruolo/entitlement atteso | UI app attesa | Comportamento server (verificato qui) | QA richiesto all'agente app |
|---|---|---|---|---|---|
| **Nuovo account dopo cutoff** (`created_at >= FOUNDER_END_AT`) | `auth.users.created_at` | Nessun ruolo Founder. Solo l'eventuale trial nativo store, poi piani a pagamento. | Nessun badge/riferimento Founder in UI. | `grant_founder_launch_core` ritorna `notEligibleReason: "program_closed"` a ogni tentativo, sempre `grantCreated: false`. Verificato (scenari 2, 3). | Confermare che l'app non mostri MAI più "founder"/"Pro a vita gratis" per account creati dopo il cutoff, in nessuna schermata. |
| **Account pre-cutoff, entro la grazia individuale (14gg)** | `auth.users.created_at` + prima sync riuscita entro `created_at + 14gg` | `role='pro', note='founder-launch', expires_at=null` se prima sync riuscita e cap non pieno. | Badge "Founder · Pro · Lifetime" (pattern esistente nell'app). | `grant_founder_launch_core` concede il grant. Verificato (scenari 1, 4, 9). | Confermare che il grant reale arrivi all'app entro un ciclo di sync normale (nessun refresh manuale necessario). |
| **Account pre-cutoff, fuori dalla grazia (prima sync oltre 14gg)** | Come sopra, ma prima sync riuscita (`devices.first_sync_at`) oltre `created_at + 14gg` — mai il `now()` di una sync successiva | Nessun ruolo Founder. Trial nativo store standard, poi a pagamento. | Nessun badge Founder; comportamento identico a un account "normale". | `grant_founder_launch_core` ritorna `notEligibleReason: "window_expired"`, persistito in `private.founder_evaluations` (mai rivalutato, anche se richiamato di nuovo dallo stesso o da un altro device dell'utente). Verificato P0.10A (funzionale + multi-device). | Confermare che l'app non prometta il Founder a un utente che ha solo installato in tempo ma sincronizzato tardi: il messaggio (se esiste) deve riflettere che la finestra dei 14gg è scaduta. |
| **Founder già assegnato** (grant esistente, qualunque `created_at`) | `public.user_roles` (`role='pro'`, già presente) | Pro a vita, invariato, per sempre. | Badge Founder invariato. | Fast-path pre-lock in `grant_founder_launch_core`: `alreadyHadEligibleGrant: true`, mai rivalutato contro cutoff/finestra, mai toccato. Verificato (scenario 6, anche con `created_at` volutamente dopo il cutoff). | Nessuna azione richiesta lato app: il ruolo persiste; QA solo per confermare che nessun flusso app tenti un nuovo grant/refresh che possa alterarlo. |
| **Trial attivo** (nei 14gg dal primo avvio/registrazione, nessun grant Founder) | **Non verificabile da questo repo** — probabile introductory offer nativo Apple/Google, nessuna riga Supabase dedicata trovata | Accesso Pro completo per la durata del trial. | Countdown/indicazione trial nell'app (pattern esistente, non modificato qui). | N/A lato Supabase: nessuna migration in questo repo crea/aggiorna un trial per il percorso non-Founder (`grant_b2c_trial()` esiste ma è del sistema Gym/challenge separato, mai chiamato da `/api/v1`). | **Bloccante**: confermare a chi appartiene davvero l'enforcement del trial 14gg (store-side vs un meccanismo app-only non presente in questo repo) e come l'app lo verifica ad ogni avvio. |
| **Trial scaduto senza acquisto** | Come sopra | Nessun accesso Pro; solo funzioni free. | Paywall bloccante. | N/A lato Supabase per lo stesso motivo. | **Bloccante**: verificare su device reale che il paywall scatti davvero allo scadere dei 14gg, senza fallback che lasci Pro attivo. |
| **Subscription attiva** (Google Play / Apple IAP) | Ricevuta IAP verificata (probabilmente via RevenueCat o verifica diretta store, non presente come endpoint in questo repo) | `role='pro'`, `note` diversa da `founder-launch` (es. `google_play_purchase`/`apple_iap`), `expires_at` coerente col ciclo di rinnovo. | UI abbonamento standard. | `grant_founder_launch_core` non tocca MAI un ruolo pro esistente indipendentemente dalla nota: fast-path pre-lock esce prima di qualunque valutazione. Verificato (scenario 7, con `note='google_play_purchase'`). | Confermare che il flusso reale di verifica ricevuta (fuori da questo repo) scriva effettivamente `user_roles` con la nota corretta, e che un rinnovo/cancellazione aggiorni `expires_at` senza mai passare da `grant_founder_launch_core`. |
| **Lifetime** (acquisto una tantum) | Come sopra, `expires_at=null` | `role='pro', expires_at=null`, nota che identifica l'acquisto (non `founder-launch`). | UI "Pro a vita" dell'acquisto, distinta dal badge Founder. | Stesso fast-path del punto precedente: mai sovrascritto. | Confermare che l'app distingua visivamente "Pro a vita da acquisto" da "Pro a vita da Founder" se rilevante per il supporto clienti. |
| **Restore purchase** | Ricevuta store re-inviata dall'app | Deve ripristinare lo stesso `role='pro'` già presente (idempotente) o ricrearlo se mancante per errore pregresso, mai un grant Founder. | Conferma "Acquisti ripristinati". | Fuori dal perimetro Supabase toccato da P0.10 (nessuna migration di questo sprint riguarda il percorso di restore). | **Bloccante**: verificare che restore purchase non chiami mai, direttamente o indirettamente, `record_first_sync_transition`/`grant_founder_launch_core` — quel percorso è riservato al primo sync reale, non a un restore. |
| **App Review** (`review@fitmesh.fit`, `appreview.demo@fitmesh.fit`) | Email esatta, case-insensitive | Accesso pieno per la review, MA zero consumo di posti Founder. | Comportamento pieno dell'app (nessuna limitazione), come deciso negli sprint precedenti (Founder P0). | `grant_founder_launch_core` esclude esplicitamente entrambi gli alias con `notEligibleReason: "excluded_account"`, verificato che non consumino posti (scenario 8). | Nessuna azione: comportamento invariato rispetto agli sprint precedenti, solo ri-verificato qui. |
| **Reinstallazione** (stesso utente, nuovo device/installazione) | `auth.users.id` invariato, nuovo `devices.id` | Nessun reset di eligibility: se già Founder, resta Founder; se il trial è scaduto, resta scaduto. | Nessuna sorpresa: stato identico a prima della reinstallazione. | `grant_founder_launch_core` non ha alcun concetto di "installazione" (mai un timestamp client): un nuovo `device_id` con lo stesso `user_id` rientra nel fast-path "già pro" se il grant esiste già. Verificato (scenario 14). | **Bloccante**: confermare che l'app stessa non riavvii un timer di trial locale alla reinstallazione (es. un contatore salvato solo in SharedPreferences/UserDefaults invece che derivato da una fonte server) — questo è un rischio architetturale tipico nei trial "client-side" che questo repo non può escludere. |

## Non dichiarare completato "dopo il trial deve pagare" finché AppFitmesh non conferma

Stato di questa riga: **`pending_device_and_store_verification`** — non
declassare a "completato"/"verificato" senza una conferma esplicita
dell'agente AppFitmesh su device reale. Diverso e indipendente dalla nota
`founderAutoGrant.status` in `lib/product-facts.ts` (`pending_production_verification`,
Sprint P0.6B, riguarda la riconciliazione del trigger/contatore Founder
storico — non toccata né da P0.10 né da P0.10A).

Né la migration P0.10 né la sua correzione P0.10A toccano il percorso
trial/pagamento (fuori perimetro di entrambi gli sprint, invariato). Questo
sprint dichiara GO solo sulla parte verificabile qui (cutoff, finestra
ancorata a `first_sync_at`, cap su ledger persistente, esclusioni,
non-sovrascrittura, esito terminale mai rivalutato). Il requisito completo
"trial → pagamento" resta **NON verificato** finché l'agente app non
conferma su device reale, elencato esplicitamente anche nel report finale
P0.10A:

- paywall che scatta davvero dopo la scadenza del trial;
- acquisto Android (Google Play Billing) end-to-end;
- acquisto iOS (StoreKit) end-to-end;
- restore purchase end-to-end, senza toccare `grant_founder_launch_core`;
- nessun riavvio del trial alla reinstallazione;
- nessun grant Founder possibile post-cutoff dal lato app (l'app non deve
  nemmeno tentare la chiamata come se il programma fosse ancora aperto).

## Handoff esplicito per l'agente AppFitmesh

1. Confermare dove vive realmente l'enforcement del trial 14gg (store
   introductory offer vs meccanismo app-only) e documentarlo: questo repo
   non ha trovato alcuna riga Supabase dedicata.
2. Verificare le 6 voci "QA richiesto" marcate **Bloccante** sopra su
   device reale (Android e iOS), non in emulatore/simulatore quando è in
   gioco un acquisto reale.
3. Confermare che nessuna chiamata app-side a `record_first_sync_transition`
   possa mai originare da un contesto diverso dal primo sync realmente
   riuscito (retry di rete a parte, già gestiti server-side).
4. Non serve alcuna modifica al contratto HTTP di `/api/v1/sync` o alla
   firma di `record_first_sync_transition`/`grant_founder_launch_core`:
   questo sprint li ha estesi in place, stesso payload di richiesta e
   forma della risposta JSON già consumata da Build 189.
