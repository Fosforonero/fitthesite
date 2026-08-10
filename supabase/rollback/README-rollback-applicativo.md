# Rollback del registro — e perché un feature flag non è un rollback

> **Correzione del 2026-08-10.** La prima versione di questo documento proponeva
> `BILLING_LEDGER_ENABLED=false` come leva sicura: spegnere il cablaggio e
> tornare all'upsert diretto, contando sul backfill per recuperare il periodo
> scoperto. **È sbagliato, e il danno che produce è permanente.** Spiegato sotto,
> perché l'errore è istruttivo e va evitato la prossima volta.

## Perché il flag non funziona

`public.b2c_subscriptions` ha **chiave primaria su `user_id`**: una riga per
utente, e basta. `external_subscription_id` è una colonna sola, e ogni upsert la
sovrascrive.

Il registro invece ha chiave `(billing_source, ownership_key)`: righe illimitate
per utente, append-only, con la DELETE vietata da un trigger.

Ne segue la cosa che rende il flag inaccettabile. Con il cablaggio spento e
l'upsert diretto riattivato:

1. l'utente A ha già un acquisto, e la sua transazione vive **solo** in quella
   riga di `b2c_subscriptions`;
2. A ne fa un altro (un rinnovo, un lifetime dopo un abbonamento, un acquisto da
   un secondo dispositivo);
3. l'upsert su `user_id` sovrascrive `external_subscription_id`;
4. **l'identificativo della transazione precedente non esiste più da nessuna
   parte.**

Il backfill legge `b2c_subscriptions`. Ciò che è stato sovrascritto non è
"mancante": è irrecuperabile. Il buco non si richiude riaccendendo il flag,
perché il dato da cui ripartire non c'è più.

Il flag prometteva "un buco che il backfill riempie". In realtà crea buchi che
nessuno riempirà mai, ed è peggio della cosa da cui doveva proteggere.

## E il 503 come kill switch? Anche no

Rispondere 503 a tutte le validazioni sembra sicuro: nessuna scrittura, nessun
danno. Non lo è, finché in giro c'è la **189**.

Quella build **chiude la transazione anche dopo una validazione fallita**. È il
difetto che ha prodotto "pagato, niente Pro" il 5 agosto 2026. Un 503 di massa
non ferma gli acquisti: li fa fallire e poi li fa chiudere, e una transazione
chiusa non torna più. Il ripristino manuale non salva la situazione, perché
richiede che l'utente sappia di doverlo fare e che lo store abbia ancora
qualcosa da ripresentare.

Fino a quando la 189 è la build più diffusa, **un errore restituito in massa è
una perdita di acquisti in massa.**

## Le regole, dopo l'attivazione in produzione

1. **Nessun flag può riabilitare scritture dirette a `b2c_subscriptions`.** Il
   percorso diretto non torna disponibile: non esiste una configurazione che lo
   riaccenda.
2. **Verifica JWS e claim immutabile restano sempre attivi.** Non sono
   opzionali e non hanno un interruttore.
3. **Nessun 200 senza claim e proiezione atomici.** Se il claim non riesce, non
   si risponde successo.
4. **Nessun ritorno a `verifyReceipt` per un JWS StoreKit 2.** Il ramo legacy
   resta solo per le ricevute StoreKit 1, che sono un formato diverso.
5. **L'assenza di `client_contract_version` identifica esplicitamente la 189**,
   e le si risponde nel formato che sa leggere. Non è un default: è un caso
   riconosciuto e trattato.

## Che cos'è allora un rollback

**Selezionare una versione precedente nota-buona della route e della RPC**,
conservando registro e claim.

Non è un interruttore: è un deploy di un artefatto già provato, che continua a
verificare gli acquisti e a scrivere il registro, e che si limita a non
contenere il difetto introdotto. Il registro non viene mai spento, perché è la
sola cosa che rende recuperabile tutto il resto.

Requisiti perché una versione sia "nota-buona":

- verifica JWS/Google attiva;
- claim e proiezione nella stessa transazione;
- payload della 189 (senza `client_contract_version`) servito correttamente;
- provata su rollback, timeout e persistenza fallita, non solo sul percorso
  felice.

## Se non esiste nessun percorso ledger funzionante

Allora **si sospendono i nuovi acquisti lato store**: prodotti resi non
acquistabili in App Store Connect e Play Console.

È una decisione spiacevole e va presa da una persona. Ma l'alternativa —
lasciare che gli acquisti continuino aggirando il registro — significa incassare
denaro senza poter dire di chi sia la transazione, ed è esattamente lo stato che
questo sprint esiste per non riprodurre.

Sospendere la vendita si annulla. Incassare un acquisto che non si sa attribuire,
no.

## La leva distruttiva, per completezza

`20260808211929_billing_purchase_claims_registry_rollback.sql` elimina tabella,
funzione e trigger. Si **rifiuta** se la tabella contiene anche una sola riga:

```
ERROR: rollback rifiutato: private.billing_purchase_claims contiene N righe.
Eliminare la tabella rende quegli acquisti di nuovo reclamabili da un altro
utente. Esportare prima, poi rieseguire con -v claims_rollback_force=1.
```

Cancellare il registro non annulla una funzionalità: rende ogni acquisto che
conteneva di nuovo libero, quindi reclamabile dal primo account che lo presenta.
`claims_rollback_force=1` esiste per i database di prova. Su produzione va usato
solo dopo un export e una decisione di cui qualcuno risponde.

## Ordine, se serve davvero tornare indietro

1. Deploy della versione precedente nota-buona della route. Il registro resta.
2. Diagnosi con il registro intatto da leggere.
3. Correzione e nuovo deploy in avanti.
4. Se al passo 1 non esiste nessuna versione che scriva il registro: sospendere
   la vendita, non aggirarlo.
5. La leva distruttiva non entra in questa sequenza.
