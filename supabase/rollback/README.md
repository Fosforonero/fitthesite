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
