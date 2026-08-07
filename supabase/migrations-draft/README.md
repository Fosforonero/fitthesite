# Migration non applicabili — bozze con prerequisiti non versionati

I file qui dentro **non** sono migration attive: la CLI Supabase non li vede e
`supabase start` non li esegue. Sono conservati **invariati**, bit per bit,
perche' contengono lavoro reale e una storia di decisioni che va preservata.

Stanno qui per un motivo preciso: dipendono da oggetti di produzione che
nessuna migration del repository crea. Applicarli a un database ricostruito da
zero e' impossibile, e la loro presenza nella directory attiva impediva alla
catena di completarsi, rendendo irriproducibile l'intero ambiente locale.

## 20260729161341_founder_reserve_cutoff_gate.sql

Spostata il 2026-08-07 su decisione di Matteo.

Fallisce al **primo statement** su un database vuoto:

```
ERROR: function "public._apply_founder_grant(uuid, text)" does not exist (SQLSTATE 42883)
```

Non e' un difetto della migration: quel primo statement e' un guard MD5 che
rifiuta di sovrascrivere una funzione il cui corpo non puo' verificare. Sta
funzionando come progettato. Il problema e' che la funzione non esiste in
locale, perche' **quattro oggetti Founder vivono solo in produzione e non sono
creati da nessuna migration**:

- `public._apply_founder_grant(uuid, text)` — MD5 corpo live `5c7649b942f04234c31d3c7961c4c6a0`
- `public.claim_founder_grant_if_eligible()` — MD5 corpo live `8419db344a7383ba53f01457335a3494`
- `public.founder_grants` (tabella)
- `private.grant_founder_launch_core(uuid, uuid)`

(`public.handle_new_founder()` e' invece tracciata, in
`20260610120002_founder_launch_autogrant.sql`.)

Il file stesso dichiara di essere una bozza mai eseguita: *"QUESTO FILE NON
APPLICA ANCORA NULLA IN PRODUZIONE"*. La history di produzione lo conferma: la
migration non risulta applicata da nessuna parte.

### Per riportarla fra le migration attive

Serve prima portare nella storia versionata il corpo **testuale** dei quattro
oggetti sopra, esportato con `pg_get_functiondef` e incollato verbatim. Non
riscritto a mano: il guard confronta l'MD5, quindi una riscrittura equivalente
ma non identica lo farebbe abortire — ed e' il comportamento voluto.

Vedi `docs/architecture/p010-founder-pre-apply-checklist.md` per lo stato
GO/NO-GO del lavoro Founder.
