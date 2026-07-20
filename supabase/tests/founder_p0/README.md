# Founder P0 — suite di test su Postgres disposable

17 scenari numerati (1-10, 13, 14, 16, 17 sequenziali; 11 e 15 concorrenza;
12 guasto simulato+rollback+retry) che verificano
`private.grant_founder_launch_core` e `public.record_first_sync_transition`
(migration `20260720055513_founder_launch_first_sync_grant.sql`, applicata in
produzione il 2026-07-20) su un
container Postgres **usa e getta**, mai su un branch Supabase a pagamento e
mai su produzione.

Nessuna dipendenza da Supabase reale: `01_schema.sql` replica lo schema
minimo (`auth.users`, `public.profiles/devices/fitness_metrics/user_roles`)
e uno stub fedele di `auth.uid()` (legge
`request.jwt.claim.sub` come fa PostgREST) + i ruoli `anon`/`authenticated`.

## Eseguire l'intera suite

```bash
docker rm -f founder-p0-pg 2>/dev/null
docker run -d --name founder-p0-pg -e POSTGRES_PASSWORD=postgres postgres:17
sleep 3   # attendere l'avvio di Postgres

docker cp supabase/tests/founder_p0/01_schema.sql founder-p0-pg:/01_schema.sql
docker cp supabase/tests/founder_p0/02_functions.sql founder-p0-pg:/02_functions.sql
docker cp supabase/tests/founder_p0/03_tests.sql founder-p0-pg:/03_tests.sql
docker cp supabase/tests/founder_p0/05_test12_and_restore.sql founder-p0-pg:/05_test12_and_restore.sql

docker exec founder-p0-pg psql -U postgres -f /01_schema.sql
docker exec founder-p0-pg psql -U postgres -f /02_functions.sql
docker exec founder-p0-pg psql -U postgres -f /03_tests.sql 2>&1 | grep -E "PASS|FAIL|ERROR"

./supabase/tests/founder_p0/04_concurrency.sh    # TEST 11 + TEST 15 (race reali, ~1s)

docker exec founder-p0-pg psql -U postgres -f /05_test12_and_restore.sql 2>&1 | grep -E "PASS|FAIL|ERROR"

docker rm -f founder-p0-pg
```

Esito atteso: nessuna riga `FAIL`, nessun `ERROR` non previsto dal test
stesso (TEST 1 e altri test "rejected" si aspettano un'eccezione catturata
internamente, non una risalita a psql).

## Cosa NON copre questa suite

- Il replay dell'intera catena migration da database vuoto su schema
  Supabase reale (`auth` completo, estensioni, RLS) — quello si fa contro
  `supabase/postgres:15.8.1.044` a parte, non incluso qui perché non è uno
  script ripetibile in un comando (richiede l'immagine ufficiale grande e un
  workaround locale per un bug pre-esistente indipendente, vedi
  [`docs/architecture/known-issues.md`](../../../docs/architecture/known-issues.md)).
- Qualunque cosa lato client/Flutter: quella suite vive in
  `AppFitmesh/flutter_app/test/`.

## File

| File | Scopo |
|------|-------|
| `01_schema.sql` | Schema minimo + stub `auth.uid()` + ruoli `anon`/`authenticated` |
| `02_functions.sql` | Copia delle due funzioni cosi' come nella migration reale |
| `03_tests.sql` | Scenari 1-10, 13, 14, 16, 17 (sequenziali, `test.assert()`) |
| `04_concurrency.sh` | Scenari 11 (cap, utenti diversi) e 15 (stesso utente, due device) |
| `05_test12_and_restore.sql` | Ripristina la funzione reale dopo 04 + scenario 12 (rollback su guasto simulato) |
