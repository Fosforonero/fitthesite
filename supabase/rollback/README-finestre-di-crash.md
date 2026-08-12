# Le dieci finestre di crash

Un acquisto attraversa store, client, rete, backend e database. In ognuno di
quei passaggi il processo può morire. La domanda non è "può succedere?" — può,
ed è già successo il 5 agosto 2026 — ma **dove finisce l'acquisto quando
succede**.

## I tre stati ammessi, e i due proibiti

| | Transazione | Diritto | Come si risolve |
|---|---|---|---|
| **A** | aperta | assente | Lo store la ripresenta al prossimo avvio. Si ripara da sola. |
| **B** | aperta | concesso | Il cliente ha ciò che ha pagato. La transazione si chiude al giro successivo. |
| **C** | chiusa | concesso | Stato finale corretto. |

| | | |
|---|---|---|
| **X** | chiusa, nessun diritto | Il cliente ha pagato e non ha niente, **e non tornerà**: la transazione chiusa non si ripresenta. È il difetto del 5 agosto. |
| **Y** | diritto senza verifica store | Abbiamo regalato Pro, e il registro contiene una proprietà che nessuno store conferma. |

La regola che governa tutto: **una transazione si chiude solo quando il diritto
è stato davvero consegnato, o quando insistere non può più servire a niente.**

## Le dieci finestre

Dal 12/08/2026 sono esercitate tutte e dieci. Prima ne erano esercitate
quattro e sei erano ARGOMENTATE — e due degli argomenti, per quanto corretti,
descrivevano un comportamento che il codice non aveva.

| # | Dove muore | Stato | Perché converge lì | Dove è esercitata |
|---|---|---|---|---|
| 1 | Dopo il pagamento allo store, prima che il client chiami il backend | **A** | La transazione non è mai stata chiusa. `purchaseStream` la riconsegna al prossimo avvio. | `purchase_crash_windows_test.dart` |
| 2 | Durante la verifica Apple/Google (rete, timeout, OCSP) | **A** | `retryable` → 503 → il client non chiude niente. Un silenzio non è un rifiuto. | `route.test.ts` (F2, F2bis) |
| 3 | Dopo la verifica, prima della chiamata RPC | **A** | Nessuna scrittura è avvenuta, e non è più un'affermazione: il test misura che al momento della verifica il client del database non è ancora stato toccato. | `route.test.ts` (F3) |
| 4 | Dentro la RPC, dopo il claim e prima della proiezione | **A** | Una sola transazione Postgres: il claim viene annullato insieme alla proiezione. Se restasse, ci sarebbe una proprietà assegnata a chi non ha il diritto — e quella persona non potrebbe nemmeno ritentare, perché la sua transazione risulterebbe già consumata. | `70-crash-windows.sql` (F4) |
| 5 | Dentro la RPC, dopo la proiezione e prima del commit | **A** | Senza commit non esiste niente. Riprodotta con un SAVEPOINT: la RPC completa davvero e poi la transazione che la conteneva viene annullata. | `70-crash-windows.sql` (F5) |
| 6 | Dopo il commit, prima che la risposta arrivi al client | **B → C** | Il diritto c'è, la transazione è aperta. La ripresentazione dà `already_owned_by_same_user`, 200, e chiude. | `70-crash-windows.sql` (F6) |
| 7 | Il client riceve 200 e muore prima di `completePurchase` | **B → C** | Identico a 6 dal lato server. Le ripresentazioni sono idempotenti e non producono conflitti verso il titolare. | `70-crash-windows.sql` (F7) |
| 8 | Durante `completePurchase` | **B o C** | Se lo store non registra la chiusura, la transazione torna; se la registra, siamo in C. In entrambi i casi il diritto c'è già. | `purchase_crash_windows_test.dart` |
| 9 | Dopo `completePurchase`, prima di aggiornare lo stato locale in app | **C** | Lo stato locale non è la fonte di verità: `get_entitlement_status()` lo ricostruisce al prossimo avvio. | `purchase_crash_windows_test.dart` |
| 10 | Una richiesta partita **prima** di una revoca arriva **dopo** | **A** | La guardia di freschezza rifiuta un'evidenza più vecchia di quella registrata: un `active` in ritardo non resuscita una revoca. Senza, sarebbe **Y**. | `70-crash-windows.sql` (F10) |

## Cosa hanno trovato, scrivendole

Due finestre su sei non si comportavano come l'argomento diceva.

**La 2.** Un'eccezione del verificatore JWS usciva dal route handler. Niente
corpo, niente `error`, niente `disposition`: la 189, che legge quei campi per
nome senza validare la forma, ne riceveva due null. Il ramo StoreKit 1 era
protetto da sempre; quello StoreKit 2, che percorrono tutti i client moderni,
no.

**La 8.** `_finish` chiamava `completePurchase` senza protezione. Una
`PlatformException` dello store usciva da `_handleVerifiedPurchase` e arrivava
fino al gestore dello stream: tutto ciò che veniva dopo non veniva eseguito, e
su un dispositivo vero diventava una segnalazione di crash per una situazione
che questo documento descrive come normale.

## Perché X non è raggiungibile

X richiede che la transazione venga chiusa senza diritto. Il client chiude solo
in due casi:

1. `PurchaseValidated` **attivo** — cioè il diritto c'è (non è X);
2. `PurchaseValidationRejected`, che nasce solo da una disposizione
   `store_verified_terminal_rejection`, cioè dai tre codici in cui lo store ha
   **dimostrato** che il diritto non esiste — e un diritto che non esiste non è
   un cliente rimasto a mani vuote.

Ogni altro esito — guasti, timeout, 5xx, persistenza fallita, difetti di
contratto, conflitti di account, codici sconosciuti — lascia la transazione
aperta. La regola è nel tipo, non nella disciplina di chi scrive: le sottoclassi
di `PurchaseValidation` dichiarano `canFinishTransaction` una volta sola, e i
casi sono esercitati uno per uno in `purchase_terminal_allowlist_test.dart`.

Il punto in cui X è comparso davvero: la 189 chiude la transazione anche dopo
una validazione fallita. È per questo che, finché quella build è in giro, **un
errore restituito in massa è una perdita di acquisti in massa** — vedi
`README-rollback-applicativo.md`.

## Perché Y non è raggiungibile

Y richiede un diritto senza una verifica dello store che lo sostenga. La catena
è vincolata a ogni anello, e nessun anello è una convenzione:

```
public.b2c_subscriptions (diritto)
   ← lo scrive solo private._billing_project_entitlement
       ← che legge solo private.billing_purchase_states
           ← che ha una CHIAVE ESTERNA verso private.billing_purchase_claims
               ← che scrive solo public.claim_store_purchase
                   ← chiamata solo dopo una verifica Apple/Google riuscita
```

E dall'esterno la porta è chiusa a livello di database: il trigger
`b2c_projection_guard`, in modalità `strict`, rifiuta qualunque scrittura
commerciale che non venga dal registro (vedi `README-rollout-registro.md`).

L'invariante finale — nessuna riga commerciale in proiezione senza una proprietà
registrata per quell'utente — è controllata come asserzione in
`70-crash-windows.sql`, non dedotta dal disegno.

## Cosa resta scoperto, dichiarato

- **StoreKit 1 (iOS < 15).** `validateAppleReceipt` filtra le transazioni con
  `cancellation_date_ms`, quindi un acquisto rimborsato torna `not_found` e la
  revoca non raggiunge il registro. Lo stato registrato resta quello vecchio.
  Non produce X né Y — il diritto proiettato resta quello di un acquisto che
  Apple ha rimborsato, quindi è una **revoca che non si propaga**, non un
  diritto inventato. Da chiudere con le App Store Server Notifications, che oggi
  non abbiamo.
- **Google.** Play non espone né una versione monotona né un "last updated":
  l'ordinamento usa l'orologio del nostro fetch, dichiarato come tale
  (`google_backend_fetch`). Due fetch nello stesso microsecondo non sono
  ordinabili, e in quel caso la guardia non applica — fail-closed.
- **Rimborsi Google.** Senza Real-time Developer Notifications, una revoca Play
  arriva solo al prossimo fetch di quel token. Stessa natura del punto sopra.
