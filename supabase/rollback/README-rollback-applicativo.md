# Rollback del registro: due leve, e una sola è quella giusta

Due modi di "tornare indietro", con conseguenze opposte. Sceglierne uno per
distrazione, in un momento di fretta, costa più del problema che si sta
cercando di risolvere.

## Leva 1 — Rollback applicativo (questa, quasi sempre)

**Spegne il cablaggio. Il registro resta, per sempre.**

Il route smette di chiamare `public.claim_store_purchase()` e torna al
comportamento precedente. La tabella `private.billing_purchase_claims` non
viene toccata: ogni proprietà già registrata resta scritta, e il giorno in cui
si riaccende il cablaggio quelle righe sono ancora lì a impedire che un
acquisto venga reclamato da un secondo account.

Si attiva con la variabile d'ambiente:

```
BILLING_LEDGER_ENABLED=false
```

Assente o diversa da `false`, il cablaggio è attivo.

**Cosa succede con il cablaggio spento:** gli acquisti tornano a essere
validati e proiettati come nella 189, senza claim di proprietà. Si perde la
protezione contro il doppio reclamo, non si perde nessun dato. Un acquisto
validato mentre la leva è abbassata non lascia una riga nel registro: quando si
riaccende, va recuperato con il backfill, che è idempotente.

**Quando serve:** un difetto nel cablaggio che blocca acquisti legittimi. La
leva ferma il difetto in un deploy, senza toccare i dati.

## Leva 2 — Rollback distruttivo (praticamente mai)

`supabase/rollback/20260808211929_billing_purchase_claims_registry_rollback.sql`
elimina tabella, funzione e trigger.

Si **rifiuta** di eseguire se la tabella contiene anche una sola riga:

```
ERROR: rollback rifiutato: private.billing_purchase_claims contiene N righe.
Eliminare la tabella rende quegli acquisti di nuovo reclamabili da un altro
utente. Esportare prima, poi rieseguire con -v claims_rollback_force=1.
```

Quella guardia non è una formalità. Cancellare il registro non "annulla una
feature": rende ogni acquisto che conteneva di nuovo libero, quindi reclamabile
dal primo account che lo presenta. È esattamente il difetto che il registro
esiste per impedire, applicato a tutti gli acquisti insieme.

`claims_rollback_force=1` esiste per i database di prova. Su produzione va usato
solo dopo aver esportato la tabella e aver deciso, con qualcuno che risponde di
quella decisione, che quei dati sono davvero da buttare.

## Perché la leva applicativa e non quella distruttiva

Un registro di proprietà vale finché è **completo**. Un buco di due settimane,
perché in quelle due settimane la tabella non esisteva, non si recupera da
nessuna parte: le transazioni di quel periodo sono state chiuse e gli store non
le ripresentano più.

La leva applicativa lascia un buco che il backfill riempie. La leva distruttiva
lascia un buco che nessuno riempie.

## Ordine, se serve davvero tornare indietro

1. `BILLING_LEDGER_ENABLED=false`, deploy. Il difetto si ferma qui.
2. Capire cosa è andato storto, con il registro ancora intatto da leggere.
3. Correggere, riaccendere, e ripassare il backfill per il periodo scoperto.
4. La leva 2 non entra in questa sequenza.
