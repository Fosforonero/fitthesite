# Rollback: script fuori dalla catena attiva

I file qui dentro **non** sono migration. La CLI Supabase non li vede e
`supabase start` non li esegue: se stessero in `supabase/migrations/`
verrebbero applicati subito dopo la migration che devono annullare, cioe'
nello stesso `supabase start`, rendendo il lavoro invisibile.

Vanno eseguiti **a mano**, contro il database che si vuole riportare indietro:

```
psql "$DB_URL" -f supabase/rollback/<file>.sql
```

Ogni file dichiara in testata cosa rimuove, cosa non tocca e cosa si perde in
modo irreversibile. Dove la perdita e' irreversibile, il file contiene un
guard che si rifiuta di procedere finche' non gli si passa esplicitamente una
variabile di forzatura: quello e' il punto in cui fermarsi a pensare, non un
ostacolo da aggirare.

## 20260808211929_billing_purchase_claims_registry_rollback.sql

Annulla il registro immutabile di proprieta' degli acquisti store
(`private.billing_purchase_claims` + `public.claim_store_purchase()`).

Il guard blocca se il registro contiene anche una sola riga: eliminarlo
significa rendere ogni acquisto gia' reclamato di nuovo reclamabile da un
altro utente, cioe' riaprire il difetto che la migration chiudeva. Prima si
esporta, poi si forza.

## 20260924120000_web_dashboard_access_verdict_rollback.sql (+ `_precondizioni.sql`)

Annulla il verdetto di accesso alla dashboard web: rimuove
`public.get_web_dashboard_access()` e `private.web_dashboard_verdict(uuid)` (la
migration non crea altro). E' una voce del manifesto 3B: i gate 17 e 18 la
esercitano in autocommit e in transazione esterna, il gate 24 prova le guardie.

Il file e' **un solo blocco `DO`, senza `begin`/`commit` nudi**: e' atomico in
entrambe le modalita' e non conferma la transazione del chiamante. Rifiuta con
uno stato parziale e se il corpo delle funzioni non e' quello della migration
(confronto con l'md5 di `prosrc`, da rimisurare se la migration cambia); non usa
mai `CASCADE`; ha un `lock_timeout` di 5 s.

**Il solo caso di perdita non rilevabile dal rollback**: se le due funzioni
esistevano gia' con un altro corpo, la migration (`create or replace`) le ha
sostituite e il rollback non puo' riportarle com'erano. Per questo, **prima di
applicare la migration**, si esegue in sola lettura
`20260924120000_web_dashboard_access_verdict_precondizioni.sql`: controlla che le
funzioni non esistano (P-1) e che le dipendenze del corpo esistano con i tipi attesi
(P-2), e stampa PASSA oppure elenca cosa manca. Non tocca il registro delle
migration. Nessuno dei due file e' stato eseguito fuori dal banco.
